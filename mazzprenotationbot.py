from telegram import Update, ForceReply
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext
import datetime
import os.path
import pickle
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Se modifica questi ambiti, elimina il file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar']

def google_calendar_auth():
    creds = None
    # Il file token.pickle memorizza le credenziali dell'utente.
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    # Se non ci sono credenziali valide, chiediamo all'utente di accedere.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Salva le credenziali per l'uso futuro.
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    return creds

def create_event(event_data):
    creds = google_calendar_auth()
    service = build('calendar', 'v3', credentials=creds)

    event = {
        'summary': event_data,
        'start': {
            'dateTime': '2023-10-25T10:00:00',  # Cambia con la data e ora desiderata
            'timeZone': 'Europe/Rome',
        },
        'end': {
            'dateTime': '2023-10-25T11:00:00',  # Cambia con la data e ora desiderata
            'timeZone': 'Europe/Rome',
        },
    }

    event = service.events().insert(calendarId='primary', body=event).execute()
    print('Evento creato: %s' % (event.get('htmlLink')))

# Funzione di avvio
def start(update: Update, context: CallbackContext) -> None:
    user = update.effective_user
    update.message.reply_html(
        rf"Benvenuto, {user.mention_html()}! Usa /prenota per prenotare un appuntamento.",
        reply_markup=ForceReply(selective=True),
    )

# Funzione per prenotare un appuntamento
def prenota(update: Update, context: CallbackContext) -> None:
    update.message.reply_text("Per favore, inviami la data e l'ora per il tuo appuntamento.")

# Funzione per gestire i messaggi di testo
def handle_message(update: Update, context: CallbackContext) -> None:
    data = update.message.text
    create_event(data)  # Crea un evento con i dettagli forniti
    update.message.reply_text(f"Hai prenotato un appuntamento per: {data}")

def main() -> None:
    updater = Updater("7581279220:AAHBeq4X1qohs3jfHTXZsQRr2FpnItR1_dE")

    dispatcher = updater.dispatcher

    # Aggiungi handler per i comandi
    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(CommandHandler("prenota", prenota))
    dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, handle_message))

    # Avvia il bot
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()