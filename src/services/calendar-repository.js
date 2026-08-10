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

  async findBufferWarnings() {
    throw new Error("findBufferWarnings must be implemented");
  }

  async listHistory() {
    throw new Error("listHistory must be implemented");
  }

  async deleteHistory() {
    throw new Error("deleteHistory must be implemented");
  }
}
