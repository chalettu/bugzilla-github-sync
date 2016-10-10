/**
 * Github-syncController
 *
 * @description :: Server-side logic for managing github-syncs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bugzilla=require("bugzilla-jsonrpc");
var bz=new bugzilla();
module.exports = {
	sync_bugzilla_issues: function (req, res) {
        bz.init({
            "username": sails.config.bugzilla.username,
            "password": sails.config.bugzilla.username,
            "url": sails.config.bugzilla.url
        });
    
        var params=[{ "component": "Service UI","product":"Red Hat CloudForms Management Engine" }];

bz.search(params).then(function(data){
    console.log(data);
});

    return res.json({
      todo: 'Not implemented yet!'
    });
  }

};

