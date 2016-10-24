# bugzilla-github-sync

This app can be used to sync bugzilla tickets into Github issues

## Installation

To develop and test locally, you must have Node installed.

Clone the Repo     
Run ```npm install```  
Once you have all the settings configured , to launch the app you can either type ``` npm start ```

### Configure settings

This app supports either setting enviromental variables or using a config.json file to configure the settings  

If you want environment variables set  

**PORT** -> port number to run the server  
**sails_bugzilla__username** -> Bugzilla User ID   
**sails_bugzilla__password** -> Bugzilla password  
**sails_bugzilla__url** -> URL to the bugzilla server  
**sails_github__github_token** -> Github oath token for the user that will be creating issues   
**sails_github__repo** -> github repo .  Format is "owner/repo".  Example (**chalettu/javascript_test**)

I created a shell script in the root of the repo that you can fill in to set all the env variables for you.
In the terminal type ```source env_variables.sh```

### Usage scenarios


### Docker usage
This repo comes with a working DOCKERFILE and all you need to get it set up is run a docker build like below  
```docker build -t myDockerId/bugzilla-github-sync .```  
```docker run -dt myDockerId/bugzilla-github-sync ```  

If you would like to run this in a container and do not need to update the code base, please view the image at [https://hub.docker.com/r/chaleninja/bugzilla-github-sync/](https://hub.docker.com/r/chaleninja/bugzilla-github-sync/) 


## License

See [LICENSE.txt](LICENSE.txt)