import { defineAsyncComponent } from "vue";
import { NavBar } from "./navbar.js";

export async function Calendar() {
  return {
    props: ["username"],

    components: { 
      NavBar: defineAsyncComponent(NavBar),
    },

    template: await fetch("./Components/calendarPage.html").then((r) => r.text()),
  };
}