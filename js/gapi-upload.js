// TODO: Set the below credentials
const CLIENT_ID = '476357969685-j6fbau0unnuhkkkjld1p8401ganmf7pm.apps.googleusercontent.com';
const API_KEY = '6vaCs5EMMbjlJ6Eoz-mJu8Za';

// Discovery URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Set API access scope before proceeding authorization request
const SCOPES = 'https://www.googleapis.com/auth/drive';
let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
	gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
	await gapi.client.init({
		apiKey: API_KEY,
		discoveryDocs: [DISCOVERY_DOC],
	});
	gapiInited = true;
	maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: '', // defined later
	});
	gisInited = true;
	maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
	if (gapiInited && gisInited) {
		document.getElementById('authorize_button').style.visibility = 'visible';
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
	tokenClient.callback = async (resp) => {
		if (resp.error !== undefined) {
			throw (resp);
		}
		document.getElementById('signout_button').style.visibility = 'visible';
		document.getElementById('authorize_button').value = 'Refresh';
	};

	if (gapi.client.getToken() === null) {
		// Prompt the user to select a Google Account and ask for consent to share their data
		// when establishing a new session.
		tokenClient.requestAccessToken({ prompt: 'consent' });
	} else {
		// Skip display of account chooser and consent dialog for an existing session.
		tokenClient.requestAccessToken({ prompt: '' });
	}
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
	const token = gapi.client.getToken();
	if (token !== null) {
		google.accounts.oauth2.revoke(token.access_token);
		gapi.client.setToken('');
		document.getElementById('content').style.display = 'none';
		document.getElementById('content').innerHTML = '';
		document.getElementById('authorize_button').value = 'Authorize';
		document.getElementById('signout_button').style.visibility = 'hidden';
	}
}


async function handleUpload()
{
    await handleDeleteFilesClick();
    var fileInput = document.getElementById('file-input')
    var file = fileInput.files[0];
    if (file) {
       await uploadFile(file);
       setTimeout(openImage, 10000);
    }
}

/**
 * Upload file to Google Drive.
 */
async function uploadFile(file) {
	var metadata = {
	   name: file.name,
	   mimeType: file.type,
	   parents:  ['1XVLt-fQZwgK0JJAVZqdUpPy43aAUFn5O']
	};
/*	var fileContent = 'Hello World'; // As a sample, upload a text file.
	var file = new Blob([fileContent], { type: 'text/plain' });
	var metadata = {
		'name': 'sample-file-via-js', // Filename at Google Drive
		'mimeType': 'text/plain', // mimeType at Google Drive
		// TODO [Optional]: Set the below credentials
		// Note: remove this parameter, if no target is needed
		'parents': ['1d8Qlfgs6DA3_jmlLVVt_S-g_mkB--4rk'], // Folder ID at Google Drive which is optional
	}; */

	var accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
	var form = new FormData();
	form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
	form.append('file', file);

	var xhr = new XMLHttpRequest();
	xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
	xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
	xhr.responseType = 'json';
	xhr.onload = () => {
		document.getElementById('content').innerHTML = "File uploaded successfully. The Google Drive file id is <b>" + xhr.response.id + "</b>";
		document.getElementById('content').style.display = 'block';
	};
	xhr.send(form);
}

async function handleDeleteFilesClick() {
  var folderId = '1X9ScTYO478C9OnzyG9OA3cUIfSona6t3';

  gapi.client.drive.files.list({
    q: "'" + folderId + "' in parents",
    fields: 'files(id)'
  }).then(function(response) {
    var files = response.result.files;
    if (files && files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var fileId = files[i].id;
        deleteFile(fileId);
      }
    }
  }).catch(function(error) {
    console.error('Error retrieving files:', error);
  });
}

function deleteFile(fileId) {
  gapi.client.drive.files.delete({
    fileId: fileId
  }).then(function(response) {
    console.log('File deleted:', fileId);
  }).catch(function(error) {
    console.error('Error deleting file:', error);
  });
}

function openImage()
{
	checkDownload(30000,function(done) {
		if (done)
		{
			console.log('file downloaded');
		}else
		{
			console.log('not downloaded');
		}

	});
}

function checkDownload(timeout,callBack) {
    var startTime = Date.now();
    var folderId = '1X9ScTYO478C9OnzyG9OA3cUIfSona6t3';
	function handleOpenImageClick() {
	  var imageContainer = document.getElementById('image-container');
	  gapi.client.drive.files.list({
		pageSize: 10,
		fields: 'files(id, name, webViewLink)',
		q: "'" + folderId + "' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='application/json')",
		orderBy: 'createdTime desc'
	  }).then(function(response) {
		var files = response.result.files;
		if (files && files.length > 1) {
		  files.forEach(function(file) {
		   console.log("downloaded: " + file.id);
		   var fileId = file.id;
		  	isImage(fileId, function(isImg){
			   if (isImg)
			   {
		  		   var webViewLink = file.webViewLink;
		  		   var imageUrl = webViewLink.replace(/\/file\/d\/(.*)\/view.*/, '/uc?id=$1');
		  		   imageContainer.src = imageUrl;
		       } else
		       {
					getFileContent(fileId, function(content) {
						try {
						  var jsonObject = JSON.parse(content);
						  console.log('JSON object:', jsonObject);
						} catch (error) {
						  console.error('Error parsing JSON:', error);
						}
					});
			   }
		    });
	     });
		 callBack(true);
		}else
		{
			var elapsedTime = Date.now() - startTime;
			if (elapsedTime >= timeout) {
			  callBack(false); // Timeout: File is not available
			} else {
			  setTimeout(handleOpenImageClick, 1000); // Retry after 1 second
			}
		}
	  }).catch(function(error) {
		console.error('Error retrieving image:', error);
		callBack(false);
	  });
	}

	handleOpenImageClick();
}

function isImage(fileId, callback) {
  gapi.client.drive.files.get({
    fileId: fileId,
    fields: 'mimeType'
  }).then(function (response) {
    var mimeType = response.result.mimeType;
    var isImage = mimeType.startsWith('image/');
    callback(true);
  }).catch(function (error) {
    console.error('Error checking if file is an image:', error);
    callback(false);
  });
}

function getFileContent(fileId, callback) {
  gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  }).then(function (response) {
    var content = response.body;
    callback(content);
  }).catch(function (error) {
    console.error('Error reading file:', error);
  });
}

