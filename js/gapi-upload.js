// TODO: Set the below credentials
const CLIENT_ID = '483843549561-c4thk9hm4td736jj9icpqomcgll8fv8q.apps.googleusercontent.com';
const API_KEY = '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';

// Discovery URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Set API access scope before proceeding authorization request
const SCOPES = 'https://www.googleapis.com/auth/drive';
let tokenClient;
let gapiInited = false;
let gisInited = false;

//document.getElementById('authorize_button').style.visibility = 'hidden';
//document.getElementById('signout_button').style.visibility = 'hidden';

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
		//document.getElementById('authorize_button').style.visibility = 'visible';
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(syncResult) {
	tokenClient.callback = async (resp) => {
		if (resp.error !== undefined) {
			throw (resp);
		}
		//document.getElementById('signout_button').style.visibility = 'visible';
		//document.getElementById('authorize_button').value = 'Refresh';
		if (!syncResult)
		{
			uploadFileBase64();
		}else
		{
			openImage();
		}
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
		//document.getElementById('authorize_button').value = 'Authorize';
		//document.getElementById('signout_button').style.visibility = 'hidden';
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



// Upload Base64 encoded image to Google Drive
async function uploadFileBase64() {

  const link = document.getElementById('download-photo');
  const href = link.getAttribute('href');

  const base64Data = href;
  const fileName = 'image.png'; // Set the desired file name

  const metadata = {
    name: fileName,
    mimeType: 'image/png',
    parents:  ['1igHRt59wd1mzZq-0pyjFppRIQXh3dKQD']
  };

  const fileData = base64Data.split(',')[1];
  const byteCharacters = atob(fileData);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: metadata.mimeType });

  const reader = new FileReader();
  reader.onloadend = (e) => {
    const content = e.target.result;

    const fileMetadata = {
      name: fileName,
      mimeType: metadata.mimeType,
      parents:  ['1igHRt59wd1mzZq-0pyjFppRIQXh3dKQD']
    };

    const accessToken = gapi.auth.getToken().access_token;

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', blob);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('File uploaded successfully. File ID:', response.id);

          document.getElementById('content').innerHTML = "File uploaded successfully. The Google Drive file id is <b>" + xhr.response.id + "</b>";
		  document.getElementById('content').style.display = 'block';

			setTimeout(openImage, 10000);
          //var exit_app = document.getElementById('exit-app');
          //exit_app.click();
        } else {
			document.getElementById('content').innerHTML = "File uploaded failed." + xhr.statusText + "</b>";
			document.getElementById('content').style.display = 'block';
            console.error('Error uploading file:', xhr.statusText);
        }
      }
    };
    xhr.send(form);
  };

  reader.readAsDataURL(blob);
}

/**
 * Upload file to Google Drive.
 */
async function uploadFile(file) {
	var metadata = {
	   name: file.name,
	   mimeType: file.type,
	   parents:  ['1igHRt59wd1mzZq-0pyjFppRIQXh3dKQD']
	};

  const permissions = {
    role: 'writer',
    type: 'anyone',
    allowFileDiscovery: false,
    additionalRoles: ['delete']
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
  var folderId = '1qeZ2dHlRLAZfhjNZsnuyEIREh6W8hNMv';

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
    var folderId = '1qeZ2dHlRLAZfhjNZsnuyEIREh6W8hNMv';
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
		   var extension = file.name.split('.').pop();

		   if (extension.toUpperCase() != "JSON")
		   {
		  	   var webViewLink = file.webViewLink;
		  	   var imageUrl = webViewLink.replace(/\/file\/d\/(.*)\/view.*/, '/uc?id=$1');
		  	   //imageContainer.src = imageUrl;
		  	   const canvas = document.getElementById('canvas');
  			   const context = canvas.getContext('2d');


				// Create a new image element
				const image = new Image();
				// Set the source of the image
				image.src = imageUrl;

			  //canvas.width = image.width;
			  //canvas.height = image.height;

 				// Clear the canvas
  				//context.clearRect(0, 0, canvas.width, canvas.height);

  				//context.scale(-1, 1);
  				context.drawImage(image, 0, 0);

				$('#exampleModal').show();

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

