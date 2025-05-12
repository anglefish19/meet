export async function NewChatForm() {
  return {
    props: ["username", "profileSchema"],

    data() {
      return {
        newChatName: "",
        creating: false,
        members: "",
      };
    },

    methods: {
      async createChat() {
        if (!this.newChatName) {
          alert("Please enter a name for the chat first!");
          return;
        }

        this.creating = true;

        const channel = crypto.randomUUID(); // This creates a random string
        if (this.members != "") {
          this.members = this.members.split(", ");
          this.members.push(this.username);
        } else {
          this.members = [this.username];
        }

        const allowed = [];
        const actualMembers = [];
        const removedMembers = [];
        for (const m of this.members) {
          const profiles = this.$graffiti.discover(
            ["ajz-meet-profiles"], // channels
            this.profileSchema // schema
          );
          const profileArray = [];
          for await (const { object } of profiles) {
            profileArray.push(object);
          }
          const profile = profileArray.filter(p => p.value.username == m)[0];
          if (profile) {
            allowed.push(profile.actor);
            actualMembers.push(m);
          } else {
            removedMembers.push(m);
          }
        }

        await this.$graffiti.put(
          {
            channels: [...actualMembers],
            value: {
              activity: 'Invite',
              target: "Chat",
              owner: this.username,
              participants: actualMembers,
              title: this.newChatName,
              published: Date.now(),
              channel: channel,
            },
          },
          this.$graffitiSession.value,
        );

        const chatName = this.newChatName;

        this.creating = false;
        this.members = "";
        this.newChatName = "";

        this.$router.push(`/` + this.username + `/chats/` + chatName + `/` + channel);
        if (removedMembers.length > 0) {
          alert("The following users have not been added to the chat because they don't exist: " + removedMembers.join(", "));
        }
      },
    },

    template: await fetch("./Components/newChatForm.html").then((r) => r.text()),
  };
}  