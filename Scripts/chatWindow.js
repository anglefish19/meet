export async function ChatWindow() {
    return {
      template: await fetch("./Components/chatWindow.html").then((r) => r.text()),
    };
}  