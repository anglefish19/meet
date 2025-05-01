export async function Calendar() {
    return {
      template: await fetch("./Components/calendar.html").then((r) => r.text()),
    };
  }