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
    { path: "/:username", component: UserContent, props: true },
    { path: "/:username/:chatName/:channel", component: UserContent, props: true },
    // { path: "/profile", component: Profile },
    // { path: "/chat/:chatId", component: Chat, props: true },
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
    login() {
      router.push("/" + this.$graffitiSession.value.actor);
    },

    logout() {
      router.push("/");
    }
  },
})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiLocal(),
    // graffiti: new GraffitiRemote(),
  })
  .use(router)
  .mount("#app");

window.onload = function() {
  if (session.value) {
    router.push("/" + session.value.actor);
  }
}