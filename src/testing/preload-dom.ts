import { Window } from "happy-dom"
import { BROWSER_PRESENCE, installDomGlobals } from "./dom-globals"

// Libraries like Radix pick browser or server code paths at import, and Bun shares modules across test files.
installDomGlobals(new Window({ url: "https://app.test/" }), BROWSER_PRESENCE)
