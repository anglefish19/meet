export async function NavBar() {
    return {
      template: await fetch("./Components/navbar.html").then((r) => r.text()),
    };
}  