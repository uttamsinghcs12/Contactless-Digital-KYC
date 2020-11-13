public with sharing class ContactControllerForKYC {
    
    
    public class RelatedFile {
        public String PathOnClient;
        public String Title;
        public Blob VersionData;
    }

    public ContactControllerForKYC() {

    }
    @AuraEnabled(cacheable=true)
    public static list<contact> getContactList(string searchKey) {
        string sTempSearchKey = '%' + searchKey + '%';
		
       // create contact list to store search result 
                //list<contact> listContact = [Select id,Name,Email,FirstName,LastName,Phone,MailingAddress,Document_Approval_Status__c From Contact WHERE name LIKE : sTempSearchKey AND Document_Approval_Status__c =''];
     
                   list<contact> listContact = [Select id,Name,Email,FirstName,LastName,Phone,MailingAddress,Document_Approval_Status__c From Contact WHERE name LIKE : sTempSearchKey];
     
	   // query contact records
        // for(contact oCon : [Select id,Name,Email,FirstName,LastName,PhoneFrom ContactWHERE name LIKE : sTempSearchKey]){
        //    lstContact.add(oCon);
        // }
		
       //If there are no records found with searchKey then, throw aura exception with a message
         if(listContact.size() == 0){
            throw new AuraHandledException('No Record Found..'); 
         }
         
        return listContact;
    }
    @AuraEnabled
    public static boolean uploadFiles(Id parentId,List<Map<String, Object>> files){
        Boolean isSuccess = false;
        List<ContentVersion> relatedDocuments = new List<ContentVersion>();
        for (Map<String, Object> file : files) {
            String fileJson = JSON.serialize(file);
            RelatedFile relatedDocument = (RelatedFile) JSON.deserialize(fileJson, RelatedFile.class);
            ContentVersion contentVersionFile = new ContentVersion();
            contentVersionFile.PathOnClient = relatedDocument.PathOnClient;
            contentVersionFile.Title = relatedDocument.Title;
            contentVersionFile.FirstPublishLocationId=parentId;
            contentVersionFile.VersionData = relatedDocument.VersionData;
            relatedDocuments.add(contentVersionFile);
        }
        Database.saveResult[] srFiles = Database.insert(relatedDocuments);
        for (Database.SaveResult saveResult : srFiles) {
            isSuccess = saveResult.isSuccess();
        }
        if(isSuccess){
            Identification_Document__c idc=[Select Id,Contact__c from Identification_Document__c where Id =: parentId];
            
            if(idc != null){
                Contact cont=[Select Id,Name, Email, FirstName, LastName, Phone, MailingAddress, Document_Approval_Status__c,Completed_Step__c From Contact where Id=:idc.Contact__c];
                if(cont != null){
                   cont.Document_Approval_Status__c='Pending'; 
                    cont.Completed_Step__c=4;
                    update cont;
                }
                
            }
        }
        return isSuccess;
    }

    @AuraEnabled
    public static list<contentversion> releatedFiles(Id idParent){
        list<id> lstConDocs = new list<id>();
        for(ContentDocumentLink cntLink : [Select Id, ContentDocumentId From ContentDocumentLink Where LinkedEntityId =:idParent]) {
            lstConDocs.add(cntLink.ContentDocumentId);
        }
        if(!lstConDocs.isEmpty()) {
            return [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE ContentDocumentId IN :lstConDocs];
        }
        else {
            return null;
        }

    }

    @AuraEnabled
    public static Contact getContatcbiID(String contactID){
        Contact cont=[Select Id,Name, Email, FirstName, LastName, Phone, MailingAddress,Document_Approval_Status__c,Completed_Step__c From Contact where Id=:contactID];
        if(cont !=null){
            return cont;
        }
        return null;
    }
    // https://www.salesforcecodecrack.com/2019/06/custom-file-upload-in-lightning-web.html
    // @AuraEnabled
    // public static list<contentversion> releatedFiles(Id parentId){
    //     list<id> lstConDocs = new list<id>();
    //     for(ContentDocumentLink cntLink : [Select Id, ContentDocumentId From ContentDocumentLink Where LinkedEntityId =:parentId]) {
    //         lstConDocs.add(cntLink.ContentDocumentId);
    //     }
    //     if(!lstConDocs.isEmpty()) {
    //         return [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE ContentDocumentId IN :lstConDocs];
    //     }
    //     else {
    //         return null;
    //     }
     
    // }
}
