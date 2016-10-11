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
//"last_change_time": start_date,
    var params = [{  "last_change_time": start_date,"component": "Service UI", "product": "Red Hat CloudForms Management Engine" }];
    console.log(params);
    //2016-10-04T19:01:00Z

    bz.search(params).then(function (response) {
     // console.log(response);
     var JSON_Response=JSON.parse(response);
       var bugzilla_tickets=JSON_Response.result.bugs;
      // console.log(bugzilla_tickets);
       bugzilla_tickets.forEach(function(ticket) {
        //console.log(ticket);
         var existing_record=self.find_existing_issue(ticket.id);
         
         if (existing_record != undefined){
           //what to do if the record exists

         }
         else{
           console.log("didnt find ticket");
           //what to do if no ticket is found
           self.create_github_issue(ticket).then(function (github_ticket) {
             //create the bridge in db.  
             var db_bugzilla_record = { "bugzilla_id": ticket.id, "github_id": github_ticket.number, "status": "open" }
             Github_sync.create(db_bugzilla_record).then(function (alltheKittens) {
       
             }).catch(function (err) {
               
             });
           });
         }
       });
      self.save_timer_file();
    });

    return res.json({
      todo: 'Not implemented yet!'
    });
  },
  find_existing_issue(bugzilla_id) {
    Github_sync.findOne({ "bugzilla_id": bugzilla_id }).exec(function (err, db_record) {
      if (err) {
        return res.serverError(err);
      }
      if (!db_record) { //this record doesn't exist in Github'
        //last_change_time
        return false;
      }
      else {

        return db_record;
      }

    });

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
create_github_issue:function(bugzilla_ticket){
var deferred = Q.defer();
var bugzilla_ticket_info='https://bugzilla.redhat.com/show_bug.cgi?id='+bugzilla_ticket.id;
var ticket_body=bugzilla_ticket.summary+"\n"+bugzilla_ticket_info;

var issue_details = {
      "title": bugzilla_ticket.summary,
      "body": ticket_body
    };

    //First we need to find the timer record // what if timer doesnt exist
    var options = this.build_github_request('repos/' + github_config.repo + '/issues', issue_details);
    
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
    console.log(timer_data);
    fs.writeFile(timer_file, JSON.stringify(timer_data), function (err) {
      if (err) return console.log(err);

    });

  }
};

