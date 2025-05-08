export async function Scheduler() {
  return {
    data() {
      let today = new Date();
      const offset = today.getTimezoneOffset();
      today = new Date(today.getTime() - (offset * 60 * 1000));
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const weekFromTomorrow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return {
        schedulerTitle: "",
        startDate: tomorrow.toISOString().split('T')[0],
        endDate: weekFromTomorrow.toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        creating: false,
      };
    },

    mounted() {
      function createOption(value, text) {
        const option = document.createElement('option');
        option.text = text;
        option.value = value;
        return option;
      }

      function setupOptions(timeElement) {
        for (let h = 8; h <= 24; h++) {
          let text = h > 12 ? h - 12 : h;
          text += (h >= 12 && h < 24) ? " PM" : " AM";
          timeElement.add(createOption(h, text));
          h = h == 24 ? 0 : h;
          h = h == 7 ? 24 : h;
        }
      }

      const startTime = document.getElementById('startTime');
      const endTime = document.getElementById('endTime');
      setupOptions(startTime);
      setupOptions(endTime);
      this.startTime = 8;
      this.endTime = 22;
    },

    methods: {
      setupScheduler() {
        const comparativeST = new Date(this.startDate);
        const comparativeET = new Date(this.endDate);

        const schedulerGrid = document.getElementById('grid');

        // Set rows & columns
        const numRows = this.endTime - this.startTime;
        const numCols = (comparativeET - comparativeST) / (1000 * 60 * 60 * 24) + 1;

        if (numCols <= 0) {
          alert("Entered dates are invalid — second date must be after first date!");
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
          schedulerGrid.appendChild(cell);
        }

        // Add date labels
        const dateLabels = document.getElementById('dateLabels');
        dateLabels.style.gridTemplateColumns = `repeat(${numCols}, 50px)`;
        let current = comparativeST;
        for (let i = 0; i < numCols; i++) {
          const label = document.createElement('h3');
          label.textContent = this.getDateString(current);
          dateLabels.appendChild(label);
          current = this.getNextDate(current);
        }

        // Add time labels
        const timeLabels = document.getElementById('timeLabels');
        timeLabels.style.gridTemplateRows = `repeat(${numRows}, 30px)`;
        for (let i = this.startTime; i <= this.endTime; i++) {
          const label = document.createElement('h3');

          let text = i > 12 ? i - 12 : i;
          text += (i >= 12 && i < 24) ? " PM" : " AM";
          label.textContent = text;

          timeLabels.appendChild(label);
        }
      },

      // given date, return next date
      getNextDate(givenDate) {
        return new Date(givenDate.getTime() + 24 * 60 * 60 * 1000);
      },

      getDateString(date) {
        return (date.getUTCMonth() + 1) + "/" + date.getUTCDate();
      }
    },

    template: await fetch("./Components/scheduler.html").then((r) => r.text()),
  };
}  