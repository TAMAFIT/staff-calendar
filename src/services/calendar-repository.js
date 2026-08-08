export class CalendarRepository {
  async listEvents() {
    throw new Error("listEvents must be implemented");
  }

  async getEvent() {
    throw new Error("getEvent must be implemented");
  }

  async createEvent() {
    throw new Error("createEvent must be implemented");
  }

  async updateEvent() {
    throw new Error("updateEvent must be implemented");
  }

  async deleteEvent() {
    throw new Error("deleteEvent must be implemented");
  }

  async findConflicts() {
    throw new Error("findConflicts must be implemented");
  }
}
