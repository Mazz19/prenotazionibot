from telegram import Update, ForceReply
from telegram.ext import Updater, CommandHandler, MessageHandler, filters, CallbackContext

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
    update.message.reply_text(f"Hai prenotato un appuntamento per: {data}")

def main() -> None:
    # Inserisci qui il tuo token
    updater = Updater("AAHBeq4X1qohs3jfHTXZsQRr2FpnItR1_dE")

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