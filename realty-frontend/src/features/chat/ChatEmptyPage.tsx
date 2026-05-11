import "./chats.css";

export function ChatEmptyPage() {
  return (
    <section className="chat-window">
      <div className="chat-empty-state">
        <h2>Выберите чат</h2>
        <p>Откройте переписку из списка слева.</p>
      </div>
    </section>
  );
}