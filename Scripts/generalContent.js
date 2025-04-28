export async function GeneralContent() {
  return {
    template: await fetch("./Components/generalContent.html").then((r) => r.text()),
  };
}