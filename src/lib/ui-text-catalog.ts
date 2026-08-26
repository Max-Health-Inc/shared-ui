/**
 * Translations for the strings this package's own components render.
 *
 * Same shape as an app's `translations.json` (English source string as the key,
 * one positional array per language) so the two are read the same way — but this
 * file ships WITH the components, because "Sign Out" is text belonging to the
 * header, not to each of the five apps that mount one. An app overrides any of it
 * through the `t` prop; see `ui-text.ts` for how the two combine.
 *
 * Keep every array the same length and order as {@link UI_TEXT_LANGUAGES}.
 */

export const UI_TEXT_LANGUAGES: readonly string[] = ["de", "fr", "es", "it"]

export const UI_TEXT: Record<string, readonly string[]> = {
  // ── Header ────────────────────────────────────────────────────────────────
  "Sign Out": ["Abmelden", "Se déconnecter", "Cerrar sesión", "Esci"],
  "Switch Patient": ["Patient wechseln", "Changer de patient", "Cambiar de paciente", "Cambia paziente"],
  "Manage your account": ["Konto verwalten", "Gérer mon compte", "Gestionar cuenta", "Gestisci account"],
  "Account": ["Konto", "Compte", "Cuenta", "Account"],
  "App Store": ["App Store", "App Store", "App Store", "App Store"],
  Install: ["Installieren", "Installer", "Instalar", "Installa"],
  "Install App": ["App installieren", "Installer l'application", "Instalar la app", "Installa l'app"],

  // ── Authentication states ─────────────────────────────────────────────────
  "Completing sign in...": [
    "Anmeldung wird abgeschlossen...",
    "Finalisation de la connexion...",
    "Completando el inicio de sesión...",
    "Completamento dell'accesso...",
  ],
  "Loading...": ["Wird geladen...", "Chargement...", "Cargando...", "Caricamento..."],
  "Session Expired": ["Sitzung abgelaufen", "Session expirée", "Sesión caducada", "Sessione scaduta"],
  "Your session has expired. Please sign in again to continue.": [
    "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an, um fortzufahren.",
    "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
    "Su sesión ha caducado. Inicie sesión de nuevo para continuar.",
    "La sua sessione è scaduta. Acceda di nuovo per continuare.",
  ],
  "Sign In Again": ["Erneut anmelden", "Se reconnecter", "Iniciar sesión de nuevo", "Accedi di nuovo"],
  "Use a different account": ["Anderes Konto verwenden", "Utiliser un autre compte", "Usar otra cuenta", "Usa un altro account"],
  "Sign In with SMART": [
    "Mit SMART anmelden",
    "Se connecter avec SMART",
    "Iniciar sesión con SMART",
    "Accedi con SMART",
  ],
  "Connection Problem": [
    "Verbindungsproblem",
    "Problème de connexion",
    "Problema de conexión",
    "Problema di connessione",
  ],
  "Unable to reach the authentication server. Please check your internet connection and try again.": [
    "Der Authentifizierungsserver ist nicht erreichbar. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
    "Impossible de joindre le serveur d'authentification. Vérifiez votre connexion Internet et réessayez.",
    "No se puede contactar con el servidor de autenticación. Compruebe su conexión a Internet e inténtelo de nuevo.",
    "Impossibile raggiungere il server di autenticazione. Verifichi la connessione a Internet e riprovi.",
  ],
  "Request Timed Out": [
    "Zeitüberschreitung der Anfrage",
    "Délai d'attente dépassé",
    "Tiempo de espera agotado",
    "Richiesta scaduta",
  ],
  "The authentication server took too long to respond. This is usually temporary — please try again.": [
    "Der Authentifizierungsserver hat zu lange gebraucht. Das ist meist vorübergehend — bitte versuchen Sie es erneut.",
    "Le serveur d'authentification a mis trop de temps à répondre. C'est généralement temporaire — veuillez réessayer.",
    "El servidor de autenticación tardó demasiado en responder. Suele ser temporal — inténtelo de nuevo.",
    "Il server di autenticazione ha impiegato troppo tempo a rispondere. Di solito è temporaneo — riprovi.",
  ],
  "Configuration Error": [
    "Konfigurationsfehler",
    "Erreur de configuration",
    "Error de configuración",
    "Errore di configurazione",
  ],
  "This application is not properly registered with the identity provider. Please contact your administrator.": [
    "Diese Anwendung ist beim Identitätsanbieter nicht korrekt registriert. Bitte wenden Sie sich an Ihre Administration.",
    "Cette application n'est pas correctement enregistrée auprès du fournisseur d'identité. Veuillez contacter votre administrateur.",
    "Esta aplicación no está correctamente registrada en el proveedor de identidad. Contacte con su administrador.",
    "Questa applicazione non è registrata correttamente presso il fornitore di identità. Contatti l'amministratore.",
  ],
  "Access Denied": ["Zugriff verweigert", "Accès refusé", "Acceso denegado", "Accesso negato"],
  "You do not have permission to access this application, or the required consent was not granted.": [
    "Sie haben keine Berechtigung für diese Anwendung, oder die erforderliche Einwilligung wurde nicht erteilt.",
    "Vous n'avez pas l'autorisation d'accéder à cette application, ou le consentement requis n'a pas été accordé.",
    "No tiene permiso para acceder a esta aplicación, o no se concedió el consentimiento necesario.",
    "Non ha il permesso di accedere a questa applicazione, oppure il consenso richiesto non è stato concesso.",
  ],
  "Something Went Wrong": [
    "Etwas ist schiefgelaufen",
    "Une erreur est survenue",
    "Algo ha ido mal",
    "Qualcosa è andato storto",
  ],
  "We couldn’t complete the sign-in process. This may be a temporary issue.": [
    "Die Anmeldung konnte nicht abgeschlossen werden. Möglicherweise ist das Problem vorübergehend.",
    "Nous n'avons pas pu finaliser la connexion. Le problème est peut-être temporaire.",
    "No hemos podido completar el inicio de sesión. Puede ser un problema temporal.",
    "Non è stato possibile completare l'accesso. Il problema potrebbe essere temporaneo.",
  ],
  "Reload Page": ["Seite neu laden", "Recharger la page", "Recargar la página", "Ricarica la pagina"],
  "Try Again": ["Erneut versuchen", "Réessayer", "Inténtelo de nuevo", "Riprova"],
  "Technical details": ["Technische Details", "Détails techniques", "Detalles técnicos", "Dettagli tecnici"],

  // ── Service states ────────────────────────────────────────────────────────
  "Service Unavailable": [
    "Dienst nicht verfügbar",
    "Service indisponible",
    "Servicio no disponible",
    "Servizio non disponibile",
  ],
  "The service is temporarily unreachable. This usually resolves within a few minutes.": [
    "Der Dienst ist vorübergehend nicht erreichbar. Das behebt sich meist innerhalb weniger Minuten.",
    "Le service est temporairement inaccessible. Cela se résout généralement en quelques minutes.",
    "El servicio está temporalmente inaccesible. Suele resolverse en unos minutos.",
    "Il servizio è temporaneamente non raggiungibile. Di solito si risolve in pochi minuti.",
  ],
  "You're Offline": ["Sie sind offline", "Vous êtes hors ligne", "Está sin conexión", "È offline"],
  "Check your network connection and try again.": [
    "Prüfen Sie Ihre Netzwerkverbindung und versuchen Sie es erneut.",
    "Vérifiez votre connexion réseau et réessayez.",
    "Compruebe su conexión de red e inténtelo de nuevo.",
    "Verifichi la connessione di rete e riprovi.",
  ],
  "An unexpected error occurred. Please try again.": [
    "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    "Une erreur inattendue s'est produite. Veuillez réessayer.",
    "Se ha producido un error inesperado. Inténtelo de nuevo.",
    "Si è verificato un errore inatteso. Riprovi.",
  ],
  Retry: ["Wiederholen", "Réessayer", "Reintentar", "Riprova"],
  "A new version is available.": [
    "Eine neue Version ist verfügbar.",
    "Une nouvelle version est disponible.",
    "Hay una nueva versión disponible.",
    "È disponibile una nuova versione.",
  ],
  "Updating…": ["Wird aktualisiert…", "Mise à jour…", "Actualizando…", "Aggiornamento…"],
  Reload: ["Neu laden", "Recharger", "Recargar", "Ricarica"],

  // ── Common controls ──────────────────────────────────────────────────────
  "Confirm Action": ["Aktion bestätigen", "Confirmer l'action", "Confirmar la acción", "Conferma azione"],
  Cancel: ["Abbrechen", "Annuler", "Cancelar", "Annulla"],
  Confirm: ["Bestätigen", "Confirmer", "Confirmar", "Conferma"],
  Close: ["Schließen", "Fermer", "Cerrar", "Chiudi"],
  "Select...": ["Auswählen...", "Sélectionner...", "Seleccionar...", "Seleziona..."],
  "Search...": ["Suchen...", "Rechercher...", "Buscar...", "Cerca..."],
  "No results found": ["Keine Ergebnisse", "Aucun résultat", "Sin resultados", "Nessun risultato"],
  "Select language": ["Sprache auswählen", "Choisir la langue", "Seleccionar idioma", "Seleziona lingua"],
  Settings: ["Einstellungen", "Paramètres", "Ajustes", "Impostazioni"],
  "Preferences for this app, stored on this device.": [
    "Einstellungen für diese App, auf diesem Gerät gespeichert.",
    "Préférences pour cette application, enregistrées sur cet appareil.",
    "Preferencias de esta app, guardadas en este dispositivo.",
    "Preferenze per questa app, salvate su questo dispositivo.",
  ],

  // ── Background scenes ────────────────────────────────────────────────────
  "Background Theme": ["Hintergrund", "Thème d'arrière-plan", "Tema de fondo", "Tema di sfondo"],
  "Choose the 3D background effect for the application.": [
    "Wählen Sie den 3D-Hintergrundeffekt der Anwendung.",
    "Choisissez l'effet d'arrière-plan 3D de l'application.",
    "Elija el efecto de fondo 3D de la aplicación.",
    "Scelga l'effetto di sfondo 3D dell'applicazione.",
  ],
  "Select a theme": ["Thema auswählen", "Choisir un thème", "Elegir un tema", "Scegli un tema"],
  "Room Edges": ["Raumkanten", "Arêtes de la pièce", "Aristas de la sala", "Spigoli della stanza"],
  "Subtle converging edge lines with horizon glow": [
    "Dezente zulaufende Kantenlinien mit Horizontleuchten",
    "Lignes convergentes discrètes avec lueur d'horizon",
    "Líneas convergentes discretas con brillo de horizonte",
    "Linee convergenti discrete con bagliore all'orizzonte",
  ],
  "Perspective Grid": [
    "Perspektivraster",
    "Grille en perspective",
    "Cuadrícula en perspectiva",
    "Griglia in prospettiva",
  ],
  "3D floor plane with grid lines": [
    "3D-Bodenfläche mit Rasterlinien",
    "Plan de sol 3D avec lignes de grille",
    "Plano de suelo 3D con líneas de cuadrícula",
    "Piano del pavimento 3D con linee di griglia",
  ],
  Flat: ["Flach", "Plat", "Plano", "Piatto"],
  "Plain solid background, no effects": [
    "Einfarbiger Hintergrund ohne Effekte",
    "Fond uni, sans effets",
    "Fondo liso, sin efectos",
    "Sfondo uniforme, senza effetti",
  ],

  // ── Profile fields ───────────────────────────────────────────────────────
  "First Name": ["Vorname", "Prénom", "Nombre", "Nome"],
  "Last Name": ["Nachname", "Nom", "Apellidos", "Cognome"],
  "Email Address": [
    "E-Mail-Adresse",
    "Adresse e-mail",
    "Dirección de correo electrónico",
    "Indirizzo e-mail",
  ],
  "e.g., John": ["z. B. Max", "p. ex. Jean", "p. ej. Juan", "ad es. Marco"],
  "e.g., Smith": ["z. B. Muster", "p. ex. Dupont", "p. ej. García", "ad es. Rossi"],

  // ── Patient banner ───────────────────────────────────────────────────────
  "Sex assigned at birth": [
    "Geschlecht bei Geburt",
    "Sexe à la naissance",
    "Sexo al nacer",
    "Sesso alla nascita",
  ],
  "{{age}} yo": ["{{age}} Jahre", "{{age}} ans", "{{age}} años", "{{age}} anni"],
  "MRN: {{value}}": [
    "Patientennummer: {{value}}",
    "N° de dossier : {{value}}",
    "N.º de historia: {{value}}",
    "N. cartella: {{value}}",
  ],
  "SAAB: {{value}}": [
    "Geschlecht bei Geburt: {{value}}",
    "Sexe à la naissance : {{value}}",
    "Sexo al nacer: {{value}}",
    "Sesso alla nascita: {{value}}",
  ],

  // ── FHIR record components ───────────────────────────────────────────────
  Approve: ["Bestätigen", "Approuver", "Aprobar", "Approva"],
  "Approving…": ["Wird bestätigt…", "Approbation…", "Aprobando…", "Approvazione…"],
  "Completed with Errors": [
    "Mit Fehlern abgeschlossen",
    "Terminé avec des erreurs",
    "Completado con errores",
    "Completato con errori",
  ],
  Delete: ["Löschen", "Supprimer", "Eliminar", "Elimina"],
  "Deleting…": ["Wird gelöscht…", "Suppression…", "Eliminando…", "Eliminazione…"],
  "Deselect All": ["Alle abwählen", "Tout désélectionner", "Deseleccionar todo", "Deseleziona tutto"],
  "Discard Changes": [
    "Änderungen verwerfen",
    "Abandonner les modifications",
    "Descartar cambios",
    "Annulla modifiche",
  ],
  Done: ["Fertig", "Terminé", "Hecho", "Fatto"],
  "Edit Record": ["Datensatz bearbeiten", "Modifier l'enregistrement", "Editar registro", "Modifica record"],
  "Edit {{resourceType}}": [
    "{{resourceType}} bearbeiten",
    "Modifier {{resourceType}}",
    "Editar {{resourceType}}",
    "Modifica {{resourceType}}",
  ],
  "Failed to Extract ({{n}})": [
    "Extraktion fehlgeschlagen ({{n}})",
    "Extraction échouée ({{n}})",
    "Extracción fallida ({{n}})",
    "Estrazione non riuscita ({{n}})",
  ],
  "Failed to save changes": [
    "Änderungen konnten nicht gespeichert werden",
    "Impossible d'enregistrer les modifications",
    "No se pudieron guardar los cambios",
    "Impossibile salvare le modifiche",
  ],
  "No editable fields defined for {{resourceType}}.": [
    "Für {{resourceType}} sind keine bearbeitbaren Felder definiert.",
    "Aucun champ modifiable n'est défini pour {{resourceType}}.",
    "No hay campos editables definidos para {{resourceType}}.",
    "Per {{resourceType}} non sono definiti campi modificabili.",
  ],
  "No structured details available": [
    "Keine strukturierten Details verfügbar",
    "Aucun détail structuré disponible",
    "No hay detalles estructurados disponibles",
    "Nessun dettaglio strutturato disponibile",
  ],
  "Pending review after save": [
    "Prüfung nach dem Speichern ausstehend",
    "Vérification en attente après l'enregistrement",
    "Pendiente de revisión tras guardar",
    "In attesa di verifica dopo il salvataggio",
  ],
  "Records Saved": ["Datensätze gespeichert", "Enregistrements sauvegardés", "Registros guardados", "Record salvati"],
  "Review Extracted Records": [
    "Extrahierte Datensätze prüfen",
    "Vérifier les enregistrements extraits",
    "Revisar los registros extraídos",
    "Verifica i record estratti",
  ],
  "Save Changes": ["Änderungen speichern", "Enregistrer les modifications", "Guardar cambios", "Salva modifiche"],
  "Save as Provisional": [
    "Als vorläufig speichern",
    "Enregistrer comme provisoire",
    "Guardar como provisional",
    "Salva come provvisorio",
  ],
  "Save {{n}} Resource(s)": [
    "{{n}} Ressource(n) speichern",
    "Enregistrer {{n}} ressource(s)",
    "Guardar {{n}} recurso(s)",
    "Salva {{n}} risorsa/e",
  ],
  "Saving Resources": [
    "Ressourcen werden gespeichert",
    "Enregistrement des ressources",
    "Guardando recursos",
    "Salvataggio delle risorse",
  ],
  "Saving…": ["Wird gespeichert…", "Enregistrement…", "Guardando…", "Salvataggio…"],
  "Select All": ["Alle auswählen", "Tout sélectionner", "Seleccionar todo", "Seleziona tutto"],
  "Show details": ["Details anzeigen", "Afficher les détails", "Mostrar detalles", "Mostra dettagli"],
  "This record is verified. Your changes will be saved as provisional until re-verified.": [
    "Dieser Datensatz ist verifiziert. Ihre Änderungen werden als vorläufig gespeichert, bis er erneut verifiziert wurde.",
    "Cet enregistrement est vérifié. Vos modifications seront enregistrées comme provisoires jusqu'à une nouvelle vérification.",
    "Este registro está verificado. Sus cambios se guardarán como provisionales hasta que se vuelva a verificar.",
    "Questo record è verificato. Le sue modifiche saranno salvate come provvisorie fino a nuova verifica.",
  ],
  Warnings: ["Warnungen", "Avertissements", "Advertencias", "Avvisi"],
  "Yes, Delete": ["Ja, löschen", "Oui, supprimer", "Sí, eliminar", "Sì, elimina"],
  "validation failed": [
    "Validierung fehlgeschlagen",
    "validation échouée",
    "la validación falló",
    "convalida non riuscita",
  ],
  "{{n}} fix(es)": ["{{n}} Korrektur(en)", "{{n}} correction(s)", "{{n}} corrección(es)", "{{n}} correzione/i"],
  "{{n}} of {{total}} saved…": [
    "{{n}} von {{total}} gespeichert…",
    "{{n}} sur {{total}} enregistrés…",
    "{{n}} de {{total}} guardados…",
    "{{n}} di {{total}} salvati…",
  ],
  "{{n}} of {{total}} selected": [
    "{{n}} von {{total}} ausgewählt",
    "{{n}} sur {{total}} sélectionnés",
    "{{n}} de {{total}} seleccionados",
    "{{n}} di {{total}} selezionati",
  ],
  "{{n}} resource(s) extracted": [
    "{{n}} Ressource(n) extrahiert",
    "{{n}} ressource(s) extraite(s)",
    "{{n}} recurso(s) extraído(s)",
    "{{n}} risorsa/e estratta/e",
  ],
  "{{n}} resource(s) saved to the health record.": [
    "{{n}} Ressource(n) in die Gesundheitsakte gespeichert.",
    "{{n}} ressource(s) enregistrée(s) dans le dossier médical.",
    "{{n}} recurso(s) guardado(s) en el historial médico.",
    "{{n}} risorsa/e salvata/e nella documentazione sanitaria.",
  ],
}
