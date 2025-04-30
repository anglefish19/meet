import { defineAsyncComponent } from "vue";
import { NavBar } from "./navbar.js";
import { Profile } from "./profile.js";

export async function ProfilePage() {
  return {
    props: ["username"],

    components: { 
      NavBar: defineAsyncComponent(NavBar),
      Profile: defineAsyncComponent(Profile),
    },

    template: await fetch("./Components/profilePage.html").then((r) => r.text()),
  };
}