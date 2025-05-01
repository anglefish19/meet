import { createApp, defineAsyncComponent } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";
import { UserContent } from "./userContent.js";
import { GeneralContent } from "./generalContent.js";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: GeneralContent },
    { path: "/:username/:view", component: UserContent, props: true },
    { path: "/:username/:view/:chatName/:channel", component: UserContent, props: true },
    { path: "/:username/:chatName/:channel", component: UserContent, props: true },
  ],
});

let session;

createApp({
  components: {
    UserContent: defineAsyncComponent(UserContent),
    GeneralContent: defineAsyncComponent(GeneralContent),
  },

  beforeCreate() {
    session = this.$graffitiSession;
  },

  methods: {
    async login() {
      router.push("/" + this.$graffitiSession.value.actor + `/chats`);

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
          type: "Profile",
          generator: "https://anglefish19.github.io/meet/",
          username: this.$graffitiSession.value.actor,
          name: this.$graffitiSession.value.actor,
          profilePic: "../Icons/Account Icon.svg",
          describes: this.$graffitiSession.value.actor,
        },
        channels: ["designftw-2025-studio1", this.$graffitiSession.value.actor],
      };

      if (profile.length == 0) {
        this.$graffiti.put(
          entry,
          this.$graffitiSession.value,
        );
        console.log(entry);
      }
    },

    // NOT SURE IF I'LL NEED THIS
    copyActor() {
      navigator.clipboard.writeText(
          this.$graffitiSession.value.actor,
      );
      alert("copied!");
  },

    logout() {
      router.push("/");
    },
  },
})
  .use(GraffitiPlugin, {
    // graffiti: new GraffitiLocal(),
    graffiti: new GraffitiRemote(),
  })
  .use(router)
  .mount("#app");

window.onload = function() {
  if (session.value && history.state.current == "/") {
    router.push("/" + session.value.actor + `/chats`);
  }
}