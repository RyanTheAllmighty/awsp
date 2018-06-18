#!/usr/bin/env node

const fs = require('fs');
const inquirer = require('inquirer');

const homeDir = process.env['HOME'];
const fileToRead = process.env['AWSP_FILE_TO_READ'].replace('~', homeDir) || `${homeDir}/.aws/config`;
const profileRegex = /\[profile .*]/g;
const bracketsRemovalRegx = /(\[profile )|(\])/g;
const defaultProfileChoice = 'default';

const promptProfileChoice = (data) => {
  const awsProfiles = data[0];
  const selectedProfile = data[1];
  
  const matches = awsProfiles.match(profileRegex);

  if (!matches) {
    console.log('No profiles found.');
    console.log('Refer to this guide for help on setting up a new AWS profile:');
    console.log('https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html');

    return;
  }

  const profiles = matches.map((match) => {
    return match.replace(bracketsRemovalRegx, '');
  });

  profiles.push(defaultProfileChoice);

  const profileChoice = [
    {
      type: 'list',
      name: 'profile',
      message: 'Choose a profile',
      choices: profiles,
      default: selectedProfile
    }
  ];

  return inquirer.prompt(profileChoice);
}

const readAwsConfig = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileToRead, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const readAwspConfig = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(`${homeDir}/.awsp`, 'utf8', (err, data) => {
      if (err) {
        // if there is an error (such as file doesn't exist yet), use the default
        resolve(defaultProfileChoice);
      } else {
        resolve(data);
      }
    });
  });
};

const writeToConfig = (answers) => {
  const profileChoice =
        answers.profile === defaultProfileChoice ? '' : answers.profile;

  return new Promise((resolve, reject) => {
    fs.writeFile(`${homeDir}/.awsp`, profileChoice, { flag: 'w' }, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

Promise.all([readAwsConfig, readAwspConfig])
  .then(promptProfileChoice)
  .then(writeToConfig)
  .catch(error => {
    console.log('Error:', error);
    process.exit(1);
  });
