import { defineAsyncComponent } from "vue";
import { ITD } from "./itd.js";

export async function ChatWindow() {
  return {
    props: ["chatName", "channel"],

    data() {
      return {
        newChatName: "",
        message: "",
        revisedMessage: "",
        creating: false,
        adding: false,
        sending: false,
        revising: false,
        members: "",
        newMembers: "",

        chatSchema: {
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
                channel: { enum: [this.channel] },
              },
            },
          },
        },

        messageSchema: {

        }
      };
    },

    components: {
      ITD: defineAsyncComponent(ITD),
    },

    methods: {
      async renameChat(invite) {
        const name = prompt(
          "Rename chat",
          invite.value.title,
        );
        if (!name) return;

        await this.$graffiti.put(
          {
            ...invite,
            value: { ...invite.value, title: name },
          },
          this.$graffitiSession.value,
        );

        this.$router.push(`/` + this.$graffitiSession.value.actor + `/chats/` + name + `/` + this.channel);
      },

      async deleteChat(invite) {
        if (!confirm("You're about to delete \"" + invite.value.title + "\". Are you sure you want to delete this chat?")) {
          return;
        }

        await this.$graffiti.delete(
          invite,
          this.$graffitiSession.value,
        );

        this.$router.push(`/` + this.$graffitiSession.value.actor + `/chats/`);
      },

      async addMembers(invite) {
        let members = prompt('Add members (separate usernames using ", ")');
        if (!members) {
          return;
        }
        else {
          members = members.split(",");
        }

        await this.$graffiti.put(
          {
            ...invite,
            channels: [...invite.channels, ...members],
            value: {
              ...invite.value,
              participants: [
                ...invite.value.participants,
                ...members,
              ],
            },
            allowed: [...invite.allowed, ...members],
          },
          this.$graffitiSession.value,
        );
      },

      async removeMember(invite, member, isOwner) {
        let actor;
        if (isOwner && invite.value.participants.length == 1) {
          this.deleteChat(invite);
          return;
        } else if (isOwner) {
          actor = invite.value.participants.filter((p) => p !== member)[0];
        } else {
          actor = invite.actor;
        }
        await this.$graffiti.put(
          {
            ...invite,
            channels: invite.channels.filter((c) => c !== member),
            value: {
              ...invite.value,
              participants: invite.value.participants.filter((p) => p !== member),
            },
            allowed: invite.allowed.filter((a) => a !== member),
            actor: actor
          },
          this.$graffitiSession.value,
        );
      },

      async sendMessage() {
        if (!this.message) {
          alert("Please compose a message first!");
          return;
        }

        this.sending = true;

        await this.$graffiti.put(
          {
            value: {
              content: this.message,
              published: Date.now(),
            },
            channels: [this.channel],
          },
          this.$graffitiSession.value,
        );

        this.sending = false;
        this.message = "";

        // Refocus the input field after sending the message
        await this.$nextTick();
        this.$refs.messageInput.focus();
      },

      async editMessage(e, messageObject) {
        if (!this.revisedMessage) {
          alert("Please compose a message first!");
          return;
        }

        this.revising = true;

        await this.$graffiti.patch(
          {
            value: [
              { "op": "replace", "path": "/content", "value": this.revisedMessage },
              { "op": "add", "path": "/revised", "value": Date.now() },
            ],
          },
          messageObject,
          this.$graffitiSession.value,
        );

        this.revising = false;
        this.revisedMessage = "";

        // Refocus the input field after sending the message
        await this.$nextTick();
        e.target.closest("li").lastElementChild.classList.remove("reveal");
      },

      async deleteMessage(messageObject) {
        await this.$graffiti.delete(messageObject, this.$graffitiSession.value);
      },

      // async addMembers(channel, members) {
      //   if (channel == this.channel) {
      //     this.adding = true;
      //   }

      //   if (members) {
      //     members = members.split(", ");
      //   }

      //   for (const member of members) {
      //     await this.$graffiti.put(
      //       {
      //         value: {
      //           activity: 'Add',
      //           object: member,
      //           target: channel,
      //         },
      //         channels: this.channels,
      //       },
      //       this.$graffitiSession.value,
      //     );
      //   }

      //   if (channel == this.channel) {
      //     this.newMembers = "";
      //   } else {
      //     this.members = "";
      //   }
      //   this.adding = false;
      // },

      revealInput(e) {
        e.target.closest("li").lastElementChild.classList.toggle("reveal");
        e.target.closest("li").lastElementChild.firstElementChild.focus();
      },
    },

    template: await fetch("./Components/chatWindow.html").then((r) => r.text()),
  };
}  