/**
 * Github_syncController
 *
 * @description :: Server-side logic for managing github-syncs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bugzilla=require("bugzilla-jsonrpc");
var bz=new bugzilla();
var github_url="https://api.github.com/";
var github_config=sails.config.github;
var rp = require('request-promise');
var fs = require('fs');
var moment=require("moment");
var Q=require('q');

module.exports = {
  sync_bugzilla_issues: function (req, res) {
    bz.init({
      "username": sails.config.bugzilla.username,
      "password": sails.config.bugzilla.username,
      "url": sails.config.bugzilla.url
    });

    var self=this;
    var last_date = self.get_timer_file();
    var start_date_moment = moment(last_date).add(2, "seconds");
    var start_date = start_date_moment.utc().format();

    var params = [{  "last_change_time": start_date,"component": "Service UI", "product": "Red Hat CloudForms Management Engine" }];

    bz.search(params).then(function (response) {
    
     self.save_timer_file();

     var JSON_Response=JSON.parse(response);
     var bugzilla_tickets=JSON_Response.result.bugs;
     sails.log.debug(bugzilla_tickets.length +" bz tickets found in component");
     
       bugzilla_tickets.forEach(function(ticket) {
          
         self.find_existing_issue(ticket.id).then(function (existing_record) {
           if (existing_record != false) {
          
             sails.log.debug("Found Matching record for bz "+existing_record.bugzilla_id);
             //what to do if the record exists
             if (ticket.status === 'CLOSED' && existing_record.ticket_status != 'closed') {
              existing_record.ticket_status='closed';
               Github_sync.update({ id: existing_record.id }, existing_record).exec(function afterwards(err, updated) {
                 if (err) {
                   // handle error here- e.g. `res.serverError(err);`
                   return;
                 }
                 self.close_github_issue(existing_record.github_id).then(function(data){
                    console.log("closed ticket ");
                 });
                 console.log('Updated db record');
               });
             }
           }
           else {
              sails.log.debug("No ticket found in DB for BZ Ticket "+ticket.id);
             //what to do if no ticket is found
             if (ticket.status !== 'CLOSED') {
               self.create_github_issue(ticket).then(function (github_ticket) {
                 //create the bridge in db.  
                 var db_bugzilla_record = { "bugzilla_id": ticket.id, "github_id": github_ticket.number, "ticket_status": "open" }

                 Github_sync.create(db_bugzilla_record).then(function (db_record) {
                   console.log(db_record);
                 }).catch(function (err) {

                 });
               });
             }
           }
         }); 
       });   
    });
    if (res == undefined) {
      return "Success";
    } 
    else {
      return res.json({
        status: 'success'
      });
    }
    
  },
  find_existing_issue(bugzilla_id) {
    var deferred = Q.defer();
    Github_sync.findOne({ "bugzilla_id": bugzilla_id }).exec(function (err, db_record) {
      if (err) {
        return res.serverError(err);
      }
      if (!db_record) { //this record doesn't exist in Github'
        //last_change_time
        deferred.resolve(false);
      }
      else {
       // console.log("found a db record matching bug id");
         deferred.resolve(db_record);
      }
    });
    return deferred.promise;
  },
build_github_request:function(url,body){
//body.access_token=github_config.github_token;
var options={
  "method":"POST",
  "uri":github_url+url,
  "body":body,
  "headers":{"User-Agent":"bugzilla-github-sync","Authorization":"token "+github_config.github_token},
  json: true
};
///console.log(options);
  return options;
},
create_github_issue: function (bugzilla_ticket) {
  var deferred = Q.defer();
  var bugzilla_ticket_info = 'https://bugzilla.redhat.com/show_bug.cgi?id=' + bugzilla_ticket.id;
  var ticket_body = bugzilla_ticket.summary + "\n" + bugzilla_ticket_info;

  var issue_details = {
    "title": bugzilla_ticket.summary,
    "body": ticket_body
  };

  var options = this.build_github_request('repos/' + github_config.repo + '/issues', issue_details);

  rp(options)
    .then(function (parsedBody) {
      deferred.resolve(parsedBody);
    });
  return deferred.promise;
},
  close_github_issue: function (github_ticket) {
    console.log('closing github issue '+github_ticket);
    var deferred = Q.defer();
    var issue_details = {
      "state": 'closed'
    };
    var options = this.build_github_request('repos/' + github_config.repo + '/issues/'+github_ticket, issue_details);
    options.method="PATCH";
    rp(options)
      .then(function (parsedBody) {
        deferred.resolve(parsedBody);
      });
    return deferred.promise;
  },
  get_timer_file: function () {
    var timer_file = '/tmp/timer.json';
    var timer_data = {};
    try {
      fs.accessSync(path, fs.F_OK);
      timer_data = require(timer_file);
    } catch (e) {
      var tmp_date = moment().subtract(15, 'days');

      timer_data = { "last_date": tmp_date.utc().format() };
      //take current date and subtract 3 hours
    }
    return timer_data.last_date;
  },
  save_timer_file: function () {
    var current_time = moment().utc().format();
    var timer_file = '/tmp/timer.json';
    timer_data = { "last_date": current_time };

    fs.writeFile(timer_file, JSON.stringify(timer_data), function (err) {
      if (err) return console.log(err);
    });
  }
};