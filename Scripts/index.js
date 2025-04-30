import { createApp, defineAsyncComponent } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { UserContent } from "./userContent.js";
import { GeneralContent } from "./generalContent.js";
import { ProfilePage } from "./profilePage.js";
import { Calendar } from "./calendarPage.js";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: GeneralContent },
    { path: "/:username", component: UserContent, props: true },
    { path: "/:username/:chatName/:channel", component: UserContent, props: true },
    { path: "/:username/profile", component: ProfilePage, props: true },
    { path: "/:username/calendar", component: Calendar, props: true },
    // { path: "/chat/:chatId", component: Chat, props: true },
  ],
});

let session;

createApp({
  components: {
    UserContent: defineAsyncComponent(UserContent),
    GeneralContent: defineAsyncComponent(GeneralContent),
    ProfilePage: defineAsyncComponent(ProfilePage),
    Calendar: defineAsyncComponent(Calendar),
  },

  beforeCreate() {
    session = this.$graffitiSession;
  },

  methods: {
    async login() {
      router.push("/" + this.$graffitiSession.value.actor);

      await this.setupProfile();
    },

    async setupProfile() {
      const profiles = this.$graffiti.discover(
        [this.$graffitiSession.value.actor],
        {
          properties: {
            value: {
              username: { type: "string" }
            },
          },
        }
      );

      const profile = [];
      for await (const { object } of profiles) {
        profile.push(object);
      }

      const entry = {
        value: {
          username: this.$graffitiSession.value.actor,
          profilePic: "../Icons/Account Icon.svg",
        },
        channels: [this.$graffitiSession.value.actor],
      };

      if (profile.length == 0) {
        this.$graffiti.put(
          entry,
          this.$graffitiSession.value,
        )
      } else {
        console.log(profile[0]);
      }
    },

    logout() {
      router.push("/");
    },
  },
})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiLocal(),
    // graffiti: new GraffitiRemote(),
  })
  .use(router)
  .mount("#app");

window.onload = function() {
  if (session.value && history.state.current == "/") {
    router.push("/" + session.value.actor);
  }
}