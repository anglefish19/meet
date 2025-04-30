export async function NavBar() {
    return {
      props: ["username"],

      template: await fetch("./Components/navbar.html").then((r) => r.text()),
    };
}  