var mongoose = require("mongoose");

var JobSchema = new mongoose.Schema({
  job_title: {
    type: String,
    default: "UI/UX Developer"
  },
  job_sla: {
    type: Number,
    default: 30
  },
  job_status: {
    type: String,
  },
  job_signal: {
    type: String,
  },
  job_description: {
    type: String
  },
  eventList:
  [
    {
      type: mongoose.Schema.Types.ObjectId, ref: 'Event'
    }
  ],
  job_startDate: {
    type: Date
  },
  job_entryDate :{
    type:Date
  }
});

// StudentSchema.plugin(mongoosePaginate);

mongoose.model("Job", JobSchema);

module.exports = mongoose.model("Job");
