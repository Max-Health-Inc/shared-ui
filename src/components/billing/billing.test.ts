import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { PlanCard, type PricingPlan } from "./plan-card"
import { formatPlanPrice } from "./price"
import { PricingGrid } from "./pricing-grid"
import { readBillingReturn, withoutBillingReturn, requestRedirect, type FetchLike } from "./use-billing-redirect"
import { UI_TEXT } from "../../lib/ui-text-catalog"

const FREE: PricingPlan = { id: "free", name: "Free", monthlyCents: 0, features: ["1 study"] }
const LITE: PricingPlan = { id: "lite", name: "Lite", monthlyCents: 900, mostPopular: true, features: ["10 GB"] }
const PRO: PricingPlan = { id: "pro", name: "Pro", monthlyCents: 4900, annualCents: 49000, features: ["100 GB"] }
const TEAM: PricingPlan = { id: "business", name: "Business", monthlyCents: 4900, perSeat: true, features: ["Per seat"] }
const ENTERPRISE: PricingPlan = { id: "enterprise", name: "Enterprise", monthlyCents: 0, contact: true, features: [] }

const card = (props: Parameters<typeof PlanCard>[0]) => renderToStaticMarkup(createElement(PlanCard, props))

describe("formatPlanPrice", () => {
  it("drops the cents on a whole amount and keeps them otherwise", () => {
    expect(formatPlanPrice(900, "USD", "en-US")).toBe("$9")
    expect(formatPlanPrice(1250, "USD", "en-US")).toBe("$12.50")
  })

  it("formats in the plan's currency", () => {
    expect(formatPlanPrice(4900, "EUR", "en-US")).toBe("€49")
  })
})

describe("PlanCard", () => {
  it("shows a zero-priced plan as free, with no period", () => {
    const html = card({ plan: FREE })
    expect(html).toContain("Free")
    expect(html).not.toContain("/ month")
  })

  it("shows a paid plan's monthly price and period", () => {
    const html = card({ plan: LITE, locale: "en-US" })
    expect(html).toContain("$9")
    expect(html).toContain("/ month")
  })

  it("prices a per-seat plan per seat", () => {
    expect(card({ plan: TEAM, locale: "en-US" })).toContain("per seat / month")
  })

  it("asks a contact plan to get in touch instead of quoting a price", () => {
    const html = card({ plan: ENTERPRISE })
    expect(html).toContain("Contact us")
    expect(html).not.toContain("Free")
  })

  it("quotes the annual price when the period is a year and the plan sells one", () => {
    const html = card({ plan: PRO, interval: "year", locale: "en-US" })
    expect(html).toContain("$490")
    expect(html).toContain("/ year")
  })

  it("falls back to the monthly price when a plan has no annual one", () => {
    const html = card({ plan: LITE, interval: "year", locale: "en-US" })
    expect(html).toContain("$9")
    expect(html).toContain("/ month")
  })

  it("marks the most popular plan, and the current plan over it", () => {
    expect(card({ plan: LITE })).toContain("Most popular")
    const current = card({ plan: LITE, current: true })
    expect(current).toContain("Current plan")
    expect(current).not.toContain("Most popular")
  })

  it("lists the features and renders the action", () => {
    const html = card({ plan: PRO, action: createElement("button", null, "Upgrade") })
    expect(html).toContain("100 GB")
    expect(html).toContain("Upgrade")
  })
})

describe("PricingGrid", () => {
  const grid = (props: Parameters<typeof PricingGrid>[0]) => renderToStaticMarkup(createElement(PricingGrid, props))

  it("renders every plan with the action the caller chooses", () => {
    const html = grid({
      plans: [FREE, LITE, PRO],
      currentPlanId: "lite",
      renderAction: (plan, { current }) => createElement("span", null, current ? `on-${plan.id}` : `buy-${plan.id}`),
    })
    expect(html).toContain("buy-free")
    expect(html).toContain("on-lite")
    expect(html).toContain("buy-pro")
    expect(html).toContain("Current plan")
  })

  it("offers the period toggle only when a plan sells annually and the caller can switch", () => {
    expect(grid({ plans: [FREE, LITE], onIntervalChange: () => {} })).not.toContain("Yearly")
    expect(grid({ plans: [FREE, PRO] })).not.toContain("Yearly")
    expect(grid({ plans: [FREE, PRO], onIntervalChange: () => {} })).toContain("Yearly")
  })
})

describe("billing return flag", () => {
  const flag = { param: "subscribed", success: "ok", cancel: "cancel" }

  it("reads success and cancel, and nothing else", () => {
    expect(readBillingReturn("?subscribed=ok", flag)).toBe("success")
    expect(readBillingReturn("?section=plan&subscribed=cancel", flag)).toBe("cancel")
    expect(readBillingReturn("?subscribed=maybe", flag)).toBeNull()
    expect(readBillingReturn("", flag)).toBeNull()
  })

  it("strips the flag and keeps the rest of the URL", () => {
    expect(withoutBillingReturn("https://x.test/settings?section=plan&subscribed=ok#top", "subscribed"))
      .toBe("https://x.test/settings?section=plan#top")
    expect(withoutBillingReturn("https://x.test/settings?section=plan", "subscribed")).toBeNull()
  })
})

describe("requestRedirect", () => {
  const respond = (status: number, body: unknown): FetchLike =>
    () => Promise.resolve(new Response(JSON.stringify(body), { status }))

  it("returns the URL the server answered with", async () => {
    expect(await requestRedirect(respond(200, { url: "https://checkout.stripe.test/x" }), "/api/billing/checkout", { plan: "lite" }))
      .toEqual({ url: "https://checkout.stripe.test/x" })
  })

  it("returns the server's error, or the status when it gave none", async () => {
    expect(await requestRedirect(respond(503, { error: "billing is not configured" }), "/p", {}))
      .toEqual({ error: "billing is not configured" })
    expect(await requestRedirect(respond(500, {}), "/p", {})).toEqual({ error: "HTTP 500" })
  })

  it("turns a network failure into an error rather than throwing", async () => {
    const offline: FetchLike = () => Promise.reject(new Error("offline"))
    expect(await requestRedirect(offline, "/p", {})).toEqual({ error: "offline" })
  })

  it("posts JSON", async () => {
    let seen: RequestInit | undefined
    const capture: FetchLike = (_, init) => {
      seen = init
      return Promise.resolve(new Response(JSON.stringify({ url: "u" })))
    }
    await requestRedirect(capture, "/p", { plan: "pro", seats: 3 })
    expect(seen?.method).toBe("POST")
    expect(seen?.body).toBe(JSON.stringify({ plan: "pro", seats: 3 }))
  })
})

describe("billing strings", () => {
  it("are all in the catalogue", () => {
    const keys = [
      "Free", "Most popular", "Current plan", "Contact us", "/ month", "/ year",
      "per seat / month", "per seat / year", "Monthly", "Yearly", "Billing period",
      "Something went wrong. Please try again.",
    ]
    for (const key of keys) expect(UI_TEXT[key], key).toBeDefined()
  })
})
