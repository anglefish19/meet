import { defineAsyncComponent, nextTick } from "vue";
import { Scheduler } from "./scheduler.js";

export async function ChatWindow() {
  return {
    props: ["chatName", "channel", "inviteSchema", "profileSchema", "username"],

    data() {
      // const path = this.$route.path.split("/");
      // let channel = path.pop();
      // if (channel == "chats") {
      //   channel = undefined;
      // } else {
      //   chatName = path.pop();
      // }

      // SCHEDULER STUFF
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const tomorrow = new Date(today.getTime() - offset * 60 * 1000 + 24 * 60 * 60 * 1000);
      const weekFromTomorrow = new Date(today.getTime() - offset * 60 * 1000 + 7 * 24 * 60 * 60 * 1000);

      return {
        newChatName: "",
        message: "",
        revisedMessage: "",
        adding: false,
        sending: false,
        revising: false,
        members: "",
        newMembers: "",
        memberNames: {},

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
          properties: {
            value: {
              required: ['content', 'published', 'messageType'],
              properties: {
                content: { type: 'string' },
                messageType: { type: 'string' },
                published: { type: 'number' }
              }
            }
          }
        },

        // SCHEDULER STUFF
        numSchedulers: 0,
        chatMembers: [],
        offset: offset * 60 * 1000,
        today: today,
        minDate: today.toISOString().split('T')[0],
        schedulerTitle: "",
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: weekFromTomorrow.toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        creating: false,
        isDragging: false,
        initialSelected: false,
        timeMouseDown: undefined,
        startX: undefined,
        startY: undefined,
        dragBox: undefined,
        availability: {
          // colnum: {
          //   date: Date,
          //   hours: {
          //     hour (1-24): true / false (true = available from i to i+1)
          //   }
          // }
        },
        schedulerSchema: {
          properties: {
            value: {
              required: ['content', 'published', 'creator', 'startTime', 'endTime', 'startDate', 'endDate', 'title', 'messageType'],
              properties: {
                content: { type: 'string' },
                published: { type: 'number' },
                creator: { type: 'string' },
                startTime: { type: 'number' },
                endTime: { type: 'number' },
                startDate: { type: 'string' },
                endDate: { type: 'string' },
                title: { type: 'string' },
                messageType: { type: 'string' }
              }
            }
          }
        },
      };
    },

    components: {
      Scheduler: defineAsyncComponent(Scheduler),
    },

    mounted() {
      this.getMembers();

      function createOption(value, text) {
        const option = document.createElement('option');
        option.text = text;
        option.value = value;
        return option;
      }

      function setupOptions(timeElement) {
        for (let h = 0; h <= 24; h++) {
          let text = h > 12 ? h - 12 : h;
          text = text == 0 ? 12 : text;
          text += (h >= 12 && h < 24) ? " PM" : " AM";
          timeElement.add(createOption(h, text));
        }
      }

      const startTime = document.getElementById('startTime');
      const endTime = document.getElementById('endTime');
      setupOptions(startTime);
      setupOptions(endTime);
      this.startTime = 8;
      this.endTime = 22;

      document.addEventListener('click', (e) => {
        if (e.target.closest("button") != document.querySelector("#chatMenuOptions") && document.querySelector("#chatMenuOptions")) {
          document.querySelector("#chatMenuOptions img").classList.remove("selected");
          document.querySelector("#chatMenuOptions").classList.remove("selected");
          document.querySelector("#chatMenu").classList.remove("revealMenu");
        }
      })
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

        this.$router.push(`/` + this.username + `/chats/` + name + `/` + this.channel);
      },

      async deleteChat(invite) {
        if (!confirm("You're about to delete \"" + invite.value.title + "\". Are you sure you want to delete this chat?")) {
          return;
        }

        await this.$graffiti.delete(
          invite,
          this.$graffitiSession.value,
        );

        this.$router.push(`/` + this.username + `/chats/`);
      },

      async addMembers(invite) {
        let members = prompt('Add members (separate usernames using ", ")');
        if (!members) {
          return;
        }
        else {
          members = members.split(",");
        }
        let actualMembers = [];
        const removedMembers = [];
        for (const m of members) {
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
            // console.log(profile.actor);
            // console.log(m);
            // allowed.push(profile.actor);
            actualMembers.push(m);
          } else {
            removedMembers.push(m);
          }
        }

        this.chatMembers = [...actualMembers];

        const channels = new Set(actualMembers);
        invite.channels.map(c => channels.add(c));

        invite.value.participants.map(p => actualMembers.push(p));
        actualMembers = [...new Set(actualMembers)];

        // const allowed = [];
        // for (const m of actualMembers) {
        //   const profiles = this.$graffiti.discover(
        //     [m], // channels
        //     this.profileSchema // schema
        //   );
        //   const profileArray = [];
        //   for await (const { object } of profiles) {
        //     profileArray.push(object);
        //   }
        //   const profile = profileArray[0];
        //   if (profile.actor) {
        //     allowed.push(profile.actor);
        //   }
        // }

        await this.$graffiti.put(
          {
            ...invite,
            channels: [...channels],
            value: {
              ...invite.value,
              participants: actualMembers,
            },
            // allowed: [...allowed],
          },
          this.$graffitiSession.value,
        );

        if (removedMembers.length > 0) {
          alert("The following users have not been added to the chat because they don't exist: " + removedMembers.join(", "));
        }

        await this.getMemberNames();
        this.toggleMembersList();
      },

      // TODO
      // async removeMember(invite, member) {
        
      // },

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
              username: this.username,
              messageType: "text"
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

        document.querySelector("#chat ul").scrollTo({
          top: document.querySelector("#chat ul").scrollHeight,
          behavior: "smooth" // Smooth scrolling effect
        });
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

      revealInput(e) {
        e.target.closest("li").lastElementChild.classList.toggle("reveal");
        e.target.closest("li").lastElementChild.firstElementChild.focus();
      },

      // SCHEDULER STUFF
      setupScheduler() {
        const comparativeST = new Date((new Date(this.startDate)).getTime() + this.offset);
        const comparativeET = new Date((new Date(this.endDate)).getTime() + this.offset);

        if (comparativeST < this.today) {
          alert("You can't make a scheduler with dates already in the past.");
          return;
        }
        const schedulerGrid = document.getElementById('grid');
        const dateLabels = document.getElementById('dateLabels');
        const timeLabels = document.getElementById('timeLabels');

        schedulerGrid.replaceChildren();
        dateLabels.replaceChildren();
        timeLabels.replaceChildren();

        // Set rows & columns
        const numRows = this.endTime - this.startTime;
        const numCols = (comparativeET - comparativeST) / (1000 * 60 * 60 * 24) + 1;

        if (numCols < 0) {
          alert("Entered dates are invalid — the second date cannot happen before the first date!");
          return;
        } else if (numRows <= 0) {
          alert("Entered times are invalid — second time must be greater than first!");
          return;
        }

        if (this.schedulerTitle == "") {
          this.schedulerTitle = "Scheduler for " + this.getDateString(comparativeST) + " to " + this.getDateString(comparativeET);
        }

        schedulerGrid.style.gridTemplateRows = `8px repeat(${numRows}, 30px)`;
        schedulerGrid.style.gridTemplateColumns = `repeat(${numCols}, 50px)`;

        // Create grid
        for (let i = 0; i < numCols; i++) {
          const spacer = document.createElement('div');
          spacer.classList.add('empty');
          schedulerGrid.appendChild(spacer);
        }
        for (let i = 0; i < numRows * numCols; i++) {
          const cell = document.createElement('div');
          cell.classList.add('grid-cell');
          cell.addEventListener('mousedown', (e) => this.startDrag(e, cell));
          cell.addEventListener('dragstart', (e) => e.preventDefault());
          schedulerGrid.appendChild(cell);
        }

        // Add date labels
        dateLabels.style.gridTemplateColumns = `repeat(${numCols}, 50px)`;
        let current = comparativeST;
        for (let i = 0; i < numCols; i++) {
          const label = document.createElement('h3');
          label.textContent = this.getDateString(current);
          this.availability[i + 1] = {
            date: current,
            hours: {}
          };
          dateLabels.appendChild(label);
          current = this.getNextDate(current);
        }

        // Add time labels
        timeLabels.style.gridTemplateRows = `repeat(${numRows}, 30px)`;
        for (let i = this.startTime; i <= this.endTime; i++) {
          const label = document.createElement('h3');

          let text = i > 12 ? i - 12 : i;
          text = (text == 0) ? 12 : text;
          text += (i >= 12 && i < 24) ? " PM" : " AM";
          label.textContent = text;

          if (i != this.endTime) {
            Object.keys(this.availability).map(k => this.availability[k]["hours"][i] = false);
          }

          timeLabels.appendChild(label);
        }

        // Add functionality
        document.addEventListener('mousemove', (e) => {
          if (this.isDragging) {
            const currentX = e.pageX;
            const currentY = e.pageY;

            this.dragBox.style.width = `${Math.abs(currentX - this.startX)}px`;
            this.dragBox.style.height = `${Math.abs(currentY - this.startY)}px`;
            this.dragBox.style.left = `${Math.min(this.startX, currentX)}px`;
            this.dragBox.style.top = `${Math.min(this.startY, currentY)}px`;
          }
        });

        document.addEventListener('mouseup', () => {
          if (this.isDragging) {
            document.querySelector('.scheduler').querySelectorAll('.grid-cell').forEach(cell => {
              const rect = cell.getBoundingClientRect();
              const cellInBox = rect.right >= Math.min(this.startX, this.dragBox.getBoundingClientRect().left) &&
                rect.left <= Math.max(this.startX, this.dragBox.getBoundingClientRect().right) &&
                rect.bottom + window.scrollY >= Math.min(this.startY, this.dragBox.getBoundingClientRect().top + window.scrollY) &&
                rect.top + window.scrollY <= Math.max(this.startY, this.dragBox.getBoundingClientRect().bottom + window.scrollY);

              if (cellInBox) this.toggleCell(cell);
            });

            this.dragBox.remove();
            this.dragBox = undefined;
            this.isDragging = false;
            this.startX = undefined;
            this.startY = undefined;
          }

          if (this.isDragging && performance.now() - this.mouseDownTime > 4) {
            this.isDragging = false;
          }
        });

        this.showGrid();

        // Synchronize scrolling
        const scroll1 = document.querySelector('#dateLabels');
        const scroll2 = document.querySelector('#grid');

        scroll1.addEventListener("scroll", () => {
          scroll2.scrollLeft = scroll1.scrollLeft;
        });

        // NOT SURE WHY SCROLL2 WIDTH > SCROLL 1 WIDTH...
        scroll2.addEventListener("scroll", () => {
          scroll1.scrollLeft = scroll2.scrollLeft;
          if (scroll1.scrollLeft < scroll2.scrollLeft) {
            scroll2.scrollLeft = scroll1.scrollLeft;
          }
        });
      },

      async sendScheduler() {
        console.log("sending scheduler");
        let cellCount = 1;
        const divisor = Object.keys(this.availability).length;
        document.querySelector('.scheduler').querySelectorAll('.grid-cell').forEach(cell => {
          const rowNum = cellCount % divisor == 0 ? divisor : cellCount % divisor;
          this.availability[rowNum]["hours"][parseInt(this.startTime) + Math.floor((cellCount - 1) / divisor)] = cell.classList.contains('selected');
          cellCount++;
        });

        // DELETE?
        // get current number of schedulers sent in chat
        // const schedulers = this.$graffiti.discover(
        //   [this.channel], // channels
        //   this.schedulerSchema // schema
        // );

        // const schedulersArray = [];
        // for await (const { object } of schedulers) {
        //   schedulersArray.push(object);
        // }
        // const numSchedulers = schedulersArray.length;

        // put scheduler object in chat channel
        const tempScheduler = await this.$graffiti.put(
          {
            value: {
              content: this.username + " sent a scheduler!",
              published: Date.now(),
              creator: this.username,
              startTime: parseInt(this.startTime),
              endTime: parseInt(this.endTime),
              startDate: this.startDate,
              endDate: this.endDate,
              title: this.schedulerTitle,
              messageType: "scheduler"
            },
            channels: [this.channel]
          },
          this.$graffitiSession.value,
        );

        // TODO: DELETE LATER
        // console.log("temp: ", tempScheduler);
        // console.log("URL: ", tempScheduler.url);
        // const actualScheduler = await this.$graffiti.get(tempScheduler.url, this.schedulerSchema);
        // graffiti:local:4JYQMSlI9jr8NHValo1rj5UjBieYtVPX
        // graffiti:local:4PH5vb3jSEMsYwRVe3shAKnuwOKV3AIj
        // graffiti:local:fXoMLVastkDHKlG2zIEeGMcaQqsqh9gE
        // graffiti:local:F83fmGwqOJwHKNcGEEAIE8ys7MHH0D5h
        // const scheduler = await this.$graffiti.delete("graffiti:local:dsphSs3o2uZ6Wd_igFZ8VQ-1gC_378EO", this.$graffitiSession.value);
        // console.log("actual: ", actualScheduler);

        // put availability object in scheduler channel
        const tempAvailability = await this.$graffiti.put(
          {
            channels: [tempScheduler.url],
            value: {
              activity: 'FillScheduler',
              target: "Scheduler",
              username: this.username,
              availability: this.availability,
              created: Date.now(),
              lastEdited: Date.now(),
            }
          },
          this.$graffitiSession.value,
        );
        // console.log("temp 2", tempAvailability);
        this.toggleScheduler();

        this.schedulerTitle = "";
        document.querySelector("#chat ul").scrollTo({
          top: document.querySelector("#chat ul").scrollHeight,
          behavior: "smooth" // Smooth scrolling effect
        });
      },

      // given date, return next date
      getNextDate(givenDate) {
        return new Date(givenDate.getTime() + 24 * 60 * 60 * 1000);
      },

      getDateString(date) {
        return (date.getUTCMonth() + 1) + "/" + date.getUTCDate();
      },

      startDrag(e, cell) {
        this.isDragging = true;
        cell.classList.toggle('selected');
        this.initialSelected = cell.classList.contains('selected');
        this.startX = e.pageX;
        this.startY = e.pageY;

        this.dragBox = document.createElement('div');
        this.dragBox.classList.add('dragging-area');
        this.dragBox.style.left = `${this.startX}px`;
        this.dragBox.style.top = `${this.startY}px`;
        this.dragBox.style.width = `1px`;
        this.dragBox.style.height = `1px`;
        document.body.appendChild(this.dragBox);
      },

      toggleCell(cell) {
        const isSelected = cell.classList.contains('selected');
        if (isSelected != this.initialSelected) {
          cell.classList.toggle('selected');
        }
      },

      clearAll() {
        document.querySelector('.scheduler').querySelectorAll('.grid-cell').forEach(cell => {
          cell.classList.remove('selected');
        });
      },

      toggleScheduler() {
        // reset scheduler if necessary
        if (document.querySelector('.scheduler').classList.contains("revealScheduler")) {
          this.showForm();
          document.querySelector('#sendbar button').classList.toggle("selected");
          document.querySelector('#sendbar img').classList.toggle("selected");
        }
        document.querySelector('.scheduler').classList.toggle("revealScheduler");
      },

      toggleSelected(event) {
        event.target.closest("button").classList.toggle("selected");
        event.target.closest("img").classList.toggle("selected");
      },

      toggleMenu() {
        document.querySelector('#chatMenu').classList.toggle("revealMenu");
      },

      toggleMembersList() {
        document.querySelector('#membersList').classList.toggle("revealMembersList");
      },

      showForm() {
        document.querySelectorAll(".scheduler-setup")[document.querySelectorAll(".scheduler-setup").length - 1].classList.add("reveal");
        document.querySelectorAll(".scheduler-grid")[document.querySelectorAll(".scheduler-grid").length - 1].classList.remove("reveal");
      },

      showGrid() {
        document.querySelectorAll(".scheduler-setup")[document.querySelectorAll(".scheduler-setup").length - 1].classList.remove("reveal");
        document.querySelectorAll(".scheduler-grid")[document.querySelectorAll(".scheduler-grid").length - 1].classList.add("reveal");
        console.log(document.querySelector(".scheduler-grid"));
      },

      // TODO
      removeUser() {

      },

      leave() {

      },

      async getUsernameFromActor() {
        const profiles = this.$graffiti.discover(
          // channels
          ["ajz-meet-profiles"],
          // schema
          this.profileSchema
        );
        const profileArray = [];
        for await (const { object } of profiles) {
          profileArray.push(object);
        }
        const profile = profileArray.filter(p => p.actor == this.$graffitiSession.value.actor)[0];
        return profile.value.username;
      },

      async getMembers() {
        if (this.channel) {
          const userChats = this.$graffiti.discover(
            [this.username], // channels
            this.chatSchema // schema
          );

          const chatsArray = [];
          for await (const { object } of userChats) {
            chatsArray.push(object);
          }
          const chat = chatsArray.filter(c => c.value.channel == this.channel)[0];
          console.log("current chat: ", chat);
          if (chat) {
            chat.value.participants.map(m => this.chatMembers.push(m));
          }

          await this.getMemberNames();
        }
      },

      async getMemberNames() {
        for (const m of this.chatMembers) {
          const profiles = this.$graffiti.discover(
            // channels
            ["ajz-meet-profiles"],
            // schema
            this.profileSchema
          );
          const profileArray = [];
          for await (const { object } of profiles) {
            profileArray.push(object);
          }
          const name = profileArray.filter(p => p.value.username == m)[0].value.name;
          this.memberNames[m] = name;
        }
      }
      // async deleteObject(object) {
      //   await this.$graffiti.delete(object.url, this.$graffitiSession.value);
      // }
    },

    template: await fetch("./Components/chatWindow.html").then((r) => r.text()),
  };
}  