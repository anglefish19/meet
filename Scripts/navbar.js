export async function NavBar() {
    return {
      props: ["username", "view", "chatName", "channel"],

      template: await fetch("./Components/navbar.html").then((r) => r.text()),
    };
}  