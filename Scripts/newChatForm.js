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
        for (const m of this.members) {
          const profiles = this.$graffiti.discover(
            // channels
            [m],
            // schema
            this.profileSchema
          );
          const profileArray = [];
          for await (const { object } of profiles) {
            profileArray.push(object);
          }
          const profile = profileArray[0];
          if (profile.actor) {
            allowed.push(profile.actor);
          }
        }

        // TODO: FIX ALLOWED
        await this.$graffiti.put(
          {
            channels: [...this.members],
            value: {
              activity: 'Invite',
              target: "Chat",
              participants: this.members,
              title: this.newChatName,
              published: Date.now(),
              channel: channel,
            },
            // allowed: allowed,
          },
          this.$graffitiSession.value,
        );

        const chatName = this.newChatName;

        this.creating = false;
        this.members = "";
        this.newChatName = "";

        this.$router.push(`/` + this.username + `/chats/` + chatName + `/` + channel);
      },
    },

    template: await fetch("./Components/newChatForm.html").then((r) => r.text()),
  };
}  