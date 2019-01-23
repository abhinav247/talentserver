var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
   
    event_description: {
        type: String
    },
    event_sla: {
        type: Number
    },
    event_status:{
        type:String
    },
    event_startDate:{
        type:Date
    },
    event_endDate:{
        type:Date
    },
    event_actualEndDate:{
      type:Date
    }
})

mongoose.model('Event', eventSchema);

module.exports = mongoose.model('Event');
