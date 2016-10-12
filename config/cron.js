module.exports.cron = {
  myFirstJob: {
    schedule: '* 1 * * * *',
    onTick: function () {
        sails.controllers.github_sync.sync_bugzilla_issues();
        var current_time=new Date().toLocaleString();
      console.log("Last run on "+current_time);
    }
  }
};