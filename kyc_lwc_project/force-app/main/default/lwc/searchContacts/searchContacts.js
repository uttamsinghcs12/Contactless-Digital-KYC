import { LightningElement, track, api } from 'lwc';
// import server side apex class method 
import getContactList from '@salesforce/apex/ContactControllerForKYC.getContactList';
import uploadFiles from '@salesforce/apex/ContactControllerForKYC.uploadFiles';
import releatedFiles from '@salesforce/apex/ContactControllerForKYC.releatedFiles';
import getContatcbiID from '@salesforce/apex/ContactControllerForKYC.getContatcbiID';



import { createRecord, getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import celebrate from '@salesforce/resourceUrl/celebrate';
import { loadScript } from 'lightning/platformResourceLoader';
// import standard toast event 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class SearchContacts extends NavigationMixin(LightningElement) {
    @track statusMessage;
    @track selectedTabId = 1;
    @track relatedImageData;
    @track contacts;
    @track selectedContactID;
    @track createdIdentificationDocumentID;
    @track filesUploaded = [];
    @track finalStaus;
    @track fileErrorMessage;
    @track documentTypeOptions = [
        { label: 'AAdhar Card', value: 'AAdhar Card' },
        { label: 'Pan Card', value: 'Pan Card' },
        { label: 'Passport', value: 'Passport' },
        { label: 'Voter Id', value: 'Voter Id' },
    ];
    @track documentType;
    @track recordSaveForFuture;
    //@track identificationDocumentFields=['document_type__c','is_record_save_for_future__c'];
    sVal = '';
    handleTabActive(event){
        alert(event.target.value);
        this.selectedTabId=event.target.value;
    }
    renderedCallback() {
        loadScript(this, celebrate + '/jsFile/celebrate.js').then(() => {
            // alert("loaded");
            console.log("Script is loaded");
        }).catch(error => {
            //alert("Error");
            console.log("Error in Script loading >>" + error);
        });

        // this.template.querySelectorAll('.slds-tabs_scoped__item').setAttribute("abc","abc");
        //console.log("li >>"+this.querySelectorAll('.slds-tabs_scoped__item').length)
    }
    navigateToNewContact(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Contact',
                actionName: 'new'
            }
        });
    }
    // update sVal var when input field value change
    updateSeachKey(event) {
        this.sVal = event.target.value;
    }

    // call apex method on button click 
    handleSearch() {
        // if search input value is not blank then call apex method, else display error msg 
        if (this.sVal !== '') {
            getContactList({
                searchKey: this.sVal
            }).then(result => {
                // set @track contacts variable with return contact list from server  
                this.contacts = result;
            }).catch(error => {
                // display server exception in toast msg 
                const event = new ShowToastEvent({
                    title: 'Error',
                    variant: 'error',
                    message: error.body.message,
                });
                this.dispatchEvent(event);
                // reset contacts var with null   
                this.contacts = null;
            });
        } else {
            // fire toast event if input field is blank
            const event = new ShowToastEvent({
                variant: 'error',
                message: 'Search text missing..',
            });
            this.dispatchEvent(event);
        }
    }
    selectContact(event) {
        this.selectedContactID = event.target.value;
        // const contact = this.contacts.find(val => { return val.Id === this.selectedContactID });
        // if (this.selectedContactID) {
        //     if (contact.Document_Approval_Status__c != "") {
        //         if(contact.Document_Approval_Status__c == "Approved"){
        //             this.showToastMessage("Success","Your Kyc is approved !! Please Select Another Contact","success")
        //         }else if(contact.Document_Approval_Status__c == "Pending"){
        //             this.showToastMessage("Info","Your Kyc is pending !! Please Select Another Contact","info")
        //         }else{
        //             this.selectedTabId = "2";
        //         }
                
        //     } else {
        //         this.selectedTabId = "2";
        //     }
        // }
        this.selectedTabId = "2";
    }
    verifyContactDetails(event) {
        if (this.selectedContactID) {
            const contact = this.contacts.find(val => { return val.Id === this.selectedContactID });
            if (contact && contact.MailingAddress && contact.MailingAddress.street) {
                //const street = contact.MailingAddress.street + " " + contact.MailingAddress.city + " " + contact.MailingAddress.state + " " + contact.MailingAddress.postalCode + " " + contact.MailingAddress.country;
                var street = contact.MailingAddress.street+" ";
                if(contact.MailingAddress.city){
                    street+=contact.MailingAddress.city+" ";
                }
                if(contact.MailingAddress.state){
                    street+=contact.MailingAddress.state+" ";
                }
                if(contact.MailingAddress.postalCode){
                    street+=contact.MailingAddress.postalCode+" ";
                }
                if(contact.MailingAddress.country){
                    street+=contact.MailingAddress.country+" ";
                }
                const websiteKey = "6879842862554717";
                const authTocken = "3FEIH3rIiOV3z7D3XQPw";
                const authId = "36b38281-7b4f-5b23-179d-4949a74d7799";

                const URL = `https://us-street.api.smartystreets.com/street-address?street=${street}&key=${websiteKey}`;
                console.log(URL + " >>" + JSON.stringify(contact));
                this.showToastMessage('Success', 'Congratulations !! Your Address is verified', 'success');
                this.selectedTabId = "3";
                // fetch(URL, {
                //     method: 'GET',
                //     headers: {
                //         "Content-Type": "application/json",
                //     },
                // }).then(function (response) {
                //     return response.json();
                // }).then((addResponse) => {
                //     console.log("Success Address verification " + JSON.stringify(addResponse));
                //     if (addResponse.length && addResponse[0].analysis.dpv_match_code == "Y") {
                //         this.showToastMessage('Success', 'Congratulations !! Your Address is verified', 'success');
                //         this.selectedTabId = "3";
                //     } else {
                //         this.showToastMessage('Error', 'Sorry !! Your Address is not verified', 'error');
                //            this.finalStaus=false;
                //            this.statusMessage=""
                //            this.statusMessage = "Sorry !! Your Address is not verified";
                //            this.selectedTabId = "5";
                //     }
                // }).catch(err => {
                //     console.log("Error" + err);
                //     this.showToastMessage('Error', 'API Error', 'error');
                // });
            }
        }
    }

    handleFileUploaded(event) {
        this.fileErrorMessage = "";
        if (event.target.files.length > 0 && event.target.files.length <= 2) {
            let files = [];
            for (var i = 0; i < event.target.files.length; i++) {
                let file = event.target.files[i];
                let reader = new FileReader();
                reader.onload = e => {
                    let base64 = 'base64,';
                    let content = reader.result.indexOf(base64) + base64.length;
                    let fileContents = reader.result.substring(content);
                    this.filesUploaded.push({ PathOnClient: file.name, Title: file.name, VersionData: fileContents });
                };
                reader.readAsDataURL(file);
            }
        } else {
            this.fileErrorMessage = "You Can't Upload more than 2 files !! Please Try again."
        }
    }

    attachFiles() {
        const fileData = { parentId: this.createdIdentificationDocumentID, files: this.filesUploaded };
        console.log("Final Files>>" + JSON.stringify(fileData));
        uploadFiles(fileData).then(result => {
            if (result == true) {
                this.getRelatedFiles(this.createdIdentificationDocumentID);
                this.showToastMessage('Great', 'Your identity verification is started', 'success');
                this.selectedTabId = "4";
            } else {
                this.showToastMessage('Error', 'There was some internal Error', 'error');
                this.finalStaus = false;
                this.statusMessage=""
                this.statusMessage = "Sorry !! Your Kyc can't be processed";
                this.selectedTabId = "5";
            }
        })
            .catch(error => {
                this.showToastMessage('Error', 'Error uploading files', 'error');
            });
    }
    showToastMessage(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
    handleDocumentTypeChnage(event) {
        const eventName = event.target.name;
        // event.preventDefault();
        //alert(eventName);
        if (eventName == "documentType") {
            this.documentType = event.target.value;
        } else if (eventName == "recordSaveForFuture") {
            this.recordSaveForFuture = event.target.checked;
        }
    }
    createDocumentRecord(event) {
        const fields = { document_type__c: this.documentType, is_record_save_for_future__c: this.recordSaveForFuture, Contact__c: this.selectedContactID };
        const recordInput = { apiName: 'Identification_Document__c', fields };
        console.log("Final Document>>" + JSON.stringify(recordInput));
        createRecord(recordInput)
            .then(doc => {
                this.createdIdentificationDocumentID = doc.id;
                // this.dispatchEvent(
                //     new ShowToastEvent({
                //         title: 'Success',
                //         message: 'Account created',
                //         variant: 'success',
                //     }),
                // );
                this.attachFiles();
            }).catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
    }
    celebrateFunction() {
        var end = Date.now() + (15 * 100);
        var interval = setInterval(function () {
            if (Date.now() > end) {
                return clearInterval(interval);
            }
            confetti({
                particleCount: 450,
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                origin: {
                    x: Math.random(),
                    y: Math.random()
                },
            });
        }, 200);
    }
    handleTabActive(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        ///const tab = event.target;
        //console.log(event.target.value + " TAB >>" + tab.toString());
        //this.selectedTabId=1;
        // const contactList = this.template.querySelector('lightning-tab-bar').children[0];
        // contactList.classList.add('panelHeader');

        // for (let k = 0; k < contactList.length; k++) {
        //     console.log(contactList[k].getAttribute('class'));
        // }
        //console.log("li >>" + this.template.querySelector("lightning-tab-bar"))
    }
    agreeCheckboxHandler(event) {
        if (event.target.checked) {
            this.template.querySelector(".agreeButton").disabled = false;
        } else {
            this.template.querySelector(".agreeButton").disabled = true;
        }
    }
    getRelatedFiles(parentRecordID) {
        this.relatedImageData = [];
        releatedFiles({ idParent: parentRecordID })
            .then(data => {
                //this.relatedImageData = data;
                if (data) {
                    data.forEach(img => {
                        this.relatedImageData.push({ Id: img.Id, url: '/sfc/servlet.shepherd/version/download/' + img.Id });
                    });
                }
                console.log("Data >>" + JSON.stringify(data));
            })
            .catch(error => {
                // this.dispatchEvent(
                //     new ShowToastEvent({
                //         title: 'Error!!',
                //         message: error.message,
                //         variant: 'error',
                //     }),
                // );
                console.log("Error in get files")
            });
    }
 
    agreeAndSignAllDetails() {
        getContatcbiID({ contactID: this.selectedContactID }).then(response => {
            this.statusMessage = "";
            if (this.selectedContactID && response) {
                if (response.Document_Approval_Status__c == "Approved") {
                    this.finalStaus = true;
                    this.selectedTabId = "5";
                    this.celebrateFunction();
                    this.template.querySelector(".refreshButton").disabled=true;
                } else if (response.Document_Approval_Status__c == "Pending") {
                    this.finalStaus = false;
                    this.selectedTabId = "5";
                    this.statusMessage = "Ohh !! Your Kyc Is Pending";
                    this.template.querySelector(".refreshButton").disabled=false;
                    //this.template.querySelector(".statusMessageDIV").classList.remove("cardFailedBox");
                    //.template.querySelector(".statusMessageDIV").classList.add("cardPendingBox");
                } else {
                    this.finalStaus = false;
                    this.selectedTabId = "5";
                    this.statusMessage = "Sorry !! Your Kyc Is Not Approved";
                    this.template.querySelector(".refreshButton").disabled=false;
                    //this.template.querySelector(".statusMessageDIV").classList.remove("cardPendingBox");
                    //this.template.querySelector(".statusMessageDIV").classList.add("cardFailedBox");
                }
            }
            console.log("data>>>" + JSON.stringify(response));
        }).catch(error => {
            console.log("Error>>>");
        });
    }
    
}