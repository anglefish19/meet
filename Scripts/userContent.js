import { defineAsyncComponent } from "vue";
import { NavBar } from "./navbar.js";
import { SideBar } from "./sidebar.js";
import { ChatWindow } from "./chatWindow.js";
import { Profile } from "./profile.js";

export async function UserContent() {
  return {
    props: ["username", "view", "chatName", "channel"],

    data() {
      return {
        clickedChannel: this.channel,
        profileSchema: {
          properties: {
            value: {
              required: [
                "name",
                "username",
                "describes",
                "generator",
                "target",
              ],
              properties: {
                name: { type: "string" },
                username: { type: "string" },
                describes: { type: "string" },
                generator: { enum: ["https://anglefish19.github.io/meet/"] },
                target: { enum: ["Profile"] },
              },
            },
          }
        },

        inviteSchema: {
          properties: {
            value: {
              required: [
                "activity",
                "target",
                "title",
                "published",
                "participants",
                "channel",
              ],
              properties: {
                activity: { enum: ["Invite"] },
                target: { enum: ["Chat"] },
                participants: {
                    type: "array",
                    items: { type: "string" },
                },
                published: { type: "number" },
                title: { type: "string" },
                channel: { type: "string" },
              },
            },
          },
        },
      }
    },

    components: { 
      NavBar: defineAsyncComponent(NavBar),
      SideBar: defineAsyncComponent(SideBar),
      ChatWindow: defineAsyncComponent(ChatWindow),
      Profile: defineAsyncComponent(Profile)
    },

    methods: {
      getChannel(channel) {
        this.clickedChannel = channel;
      }
    },

    template: await fetch("./Components/userContent.html").then((r) => r.text()),
  };
}