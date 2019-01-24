var express = require ('express');
var router = express.Router ();
var bodyParser = require ('body-parser');
var Job = require ('../../models/job');
var moment = require ('moment');
var Event = require ('../../models/event');
var map = require ('lodash/map');
var reduce = require ('lodash/reduce');

router.use (
  bodyParser.urlencoded ({
    extended: false,
  })
);

router.get ('/jobs', (req, res, next) => {
  Job.find ().populate ('eventList').exec (function (err, Jobs) {
    if (err) return console.error (err);
    else {
      res.send ({
        jobs: Jobs,
      });
    }
  });
});

router.delete ('/delete/:id', (req, res, next) => {
  console.log (req.params.id);
  Job.deleteOne ({_id: req.params.id}, async function (err) {
    if (err) return handleError (err);
    else {
      let jobs = await Job.find ().populate ('eventList');
      console.log (jobs);
      res.send ({
        msg: 'deleted sucessfully',
        data: jobs,
      });
    }
  });
});

router.post ('/postjob', function (req, res, next) {
  Job.findById (req.body.id).exec (function (error, user) {
    if (error) {
      return next (error); // express default error handler
    } else {
      if (user == null) {
        Job.create (
          {
            id: req.body.id,
            job_title: req.body.job_title,
            job_sla: req.body.job_sla,
            job_status: req.body.job_status,
            job_signal: req.body.job_signal,
            job_description: req.body.job_description,
            events: req.body.events,
            job_startDate: moment (),
          },
          function (err, Job) {
            if (err) {
              next (err);
            } else {
              res.status (200).send ({
                msg: 'job posted sucessfully',
                data: Job,
              });
            }
          }
        );
      }
    }
  });
});

router.put ('/updateEvent/:id', async (req, res, next) => {
  const eventId = req.params.id;
  const {jobId, eventIndex, field, updatedValue} = req.body;

  if (field === 'event_sla') {
    const eventJob = await Job.findById (jobId).populate ('eventList');
    const {eventList, job_startDate} = eventJob;
    const beforeUpdatedEvents = eventList.slice (0, eventIndex);

    let beforeSla = 0;
    beforeSla = reduce (
      beforeUpdatedEvents,
      (beforeSla, value, key) => {
        const {event_sla} = value;
        beforeSla += event_sla;
        return beforeSla;
      },
      beforeSla
    );

    let updatingValue = beforeSla + parseInt (updatedValue);
    eventList.forEach (async (event, index) => {
      if (index === eventIndex) {
        Event.findOneAndUpdate (
          {_id: event._id},
          {
            $set: {
              [field]: updatedValue,
              event_endDate: moment (job_startDate).add (
                updatingValue,
                'minutes'
              ),
            },
          },
          {
            new: true,
          }
        ).then (async raw => {
          console.log (
            moment (raw.event_endDate).format ('MMMM Do YYYY, h:mm:ss a')
          );
        });
      } else if (index > eventIndex) {
        Event.findOneAndUpdate (
          {_id: event._id},
          {
            $set: {
              event_endDate: moment (job_startDate).add (
                updatingValue + event.event_sla,
                'minutes'
              ),
            },
          },
          {
            new: true,
          }
        ).then (async raw => {
          console.log (
            moment (raw.event_endDate).format ('MMMM Do YYYY, h:mm:ss a')
          );
        });
      }
    });

    let resJob = await Job.findById (jobId).populate ('eventList');
    res.send ({
      data: resJob,
    });
  } else {
    delete req.body.jobId;
    Event.findOneAndUpdate (
      {_id: eventId},
      {
        $set: {
          ...req.body,
        },
      },
      {
        new: true,
      }
    )
      .then (async raw => {
        let job = await Job.findById (jobId).populate ('eventList');
        res.send ({
          data: job,
          msg: 'succesfully updated',
        });
      })
      .catch (err => {
        console.error (err);
      });
  }
});

router.put ('/job/:id', (req, res, nex) => {
  console.log (req.body);

  Job.findOneAndUpdate (
    {
      _id: req.params.id, // search query
    },
    {
      ...req.body,
    },
    {
      new: true, // return updated doc
      runValidators: true, // validate before update
    }
  )
    .then (async raw => {
      let updatedJob = await Job.findById (req.params.id).populate (
        'eventList'
      );
      res.send ({
        msg: 'job updated sucessfully',
        data: updatedJob,
      });
    })
    .catch (err => {
      console.error (err);
    });
});

router.post ('/event', async (req, res, next) => {
  // Job.findOneAndUpdate({_id:req.body.jobId},$set:{})

  let eventJob = await Job.findById (req.body.jobid).populate ('eventList');
  let job_startDate = eventJob.job_startDate;
  let {eventList}=eventJob
  if (eventList.length === 0) {
    let updatedJob = await Job.update(
      {_id: req.body.jobid},
      {
        $set: {
          job_startDate: moment (),
        },
      }
    );
    job_startDate = updatedJob.job_startDate;
    console.log(updatedJob,moment(job_startDate).format ('MMMM Do YYYY, h:mm:ss a'))
  }

  let existingEventSla = 0;
  existingEventSla = reduce (
    eventList,
    (existingEventSla, value, key) => {
      const {event_sla} = value;
      existingEventSla += parseInt (event_sla);
      return existingEventSla;
    },
    existingEventSla
  );

  let endDate = moment(job_startDate).add (
    existingEventSla + req.body.event_sla,
    'minutes'
  );

  console.log (moment (job_startDate).format ('MMMM Do YYYY, h:mm:ss a'));
  console.log (endDate.format ('MMMM Do YYYY, h:mm:ss a'));

  const eventObj = {
    event_description: req.body.event_description,
    event_status: req.body.event_status,
    event_sla: req.body.event_sla,
    event_startDate: moment (),
    event_endDate: endDate,
  };

  let event = await Event.create (eventObj).catch (error =>
    console.log (error)
  );

  eventJob.eventList.push (event._id);
  await eventJob.save ();

  let resjob = await Job.findById (req.body.jobid).populate ('eventList');

  res.send ({
    data: resjob,
  });
});

module.exports = router;
