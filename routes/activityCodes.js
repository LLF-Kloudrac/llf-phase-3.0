const express = require('express');
const pool = require('../db/dbConfig');
const verify = require('../config/verifyToken');
const format = require('pg-format');
const Router = require('express-promise-router');
const joi = require('@hapi/joi');
const { query } = require('express');
const { json } = require('body-parser');
const { object } = require('@hapi/joi');

const router = new Router();

router.get('/getActivityCodesListView', verify, (request, response) => {
    let objUser = request.user;
    console.log('user ' + objUser);
    response.render('activityCodesList', { objUser });

})
router.post('/deleteAllActivityCodes', (request, response) => {
    var projectParams = [], lstProjectId = [];
    var data = request.body['activityCodeArray[]'];
    console.log("new data", typeof data);
    console.log('dattaa=======  ', data);
    if (typeof data == 'object') {
        const objectArray = data;
        console.log('objectArray>>>>>>>>>>>>>', objectArray)
        for (var i = 0; i < objectArray.length; i++) {
            projectParams.push('$' + (i + 1));
            lstProjectId.push(objectArray[i])
            console.log('lstProjectId>>>>>>>>>>>>  ' + lstProjectId);
        }
        console.log('sfid before deltet>>>>>>>>>HHHHHHHHH>>>', lstProjectId)
        console.log('sfid before deltet>>>>>>$111111>>>>>>', projectParams)
    
        pool
            .query('DELETE FROM salesforce.Activity_Code__c WHERE sfid IN (' + projectParams.join(',') + ') ', lstProjectId)
            .then((deleteActivityCodeResult) => {
                console.log('deleteActivityCodeResult =>>' + JSON.stringify(deleteActivityCodeResult));
                response.send('Success');
            })
            .catch((deleteError) => {
                console.log('deleteError' + deleteError.stack);
                response.send('Error');
            })
    } else {
        lstProjectId = data;
        // projectParams = '$1';

        let deleteQuerry = 'DELETE FROM salesforce.Activity_Code__c ' +
            'WHERE sfid = $1';
        console.log('deleteQuerry  ' + deleteQuerry);
        pool
            .query(deleteQuerry, [lstProjectId])
            .then((deleteQuerry) => {
                console.log('deleteQuerry =>>' + JSON.stringify(deleteQuerry));
                response.send('Success');
            })
            .catch((deleteError) => {
                console.log('deleteError' + deleteError.stack);
                response.send('Error');
            })
    }
})

router.get('/activityCodesList', (request, response) => {
    let qry = 'SELECT sfid,Name,Activity_Code_Name__c,Description__c,Actual_Expense_from_tally__c,CreatedById,CreatedDate,Id,IsDeleted,planned_annual_budget__c,estimated_expense_from_tasks__c,LastActivityDate,LastModifiedById,LastModifiedDate,LastReferencedDate,LastViewedDate ' +
        'FROM salesforce.Activity_Code__c WHERE sfid IS NOT NULL';
    console.log('qry  =>' + qry)
    pool.query(qry)
        .then((activityCodeListResult) => {
            console.log('activityCodeListResult  : ' + JSON.stringify(activityCodeListResult.rows));
            if (activityCodeListResult.rowCount > 0) {

                let modifiedList = [], i = 1;
                activityCodeListResult.rows.forEach((eachRecord) => {
                    let obj = {};
                    let crDate = new Date(eachRecord.createddate);
                    crDate.setHours(crDate.getHours() + 5);
                    crDate.setMinutes(crDate.getMinutes() + 30);
                    let strDate = crDate.toLocaleString();
                    obj.sequence = i;
                    obj.selectAction = '<input type="checkbox" id="' + eachRecord.sfid + '" name="' + eachRecord.sfid + '" value="' + eachRecord.sfid + '">'
                    obj.editAction = '<button href="#" class="btn btn-primary editActivityCode" id="' + eachRecord.sfid + '" >Edit</button>'
                    obj.name = '<a href="#" class="ActivityTag" id="' + eachRecord.sfid + '" >' + eachRecord.name + '</a>';
                    obj.activityCodeName = eachRecord.activity_code_name__c;
                  //  obj.project = eachRecord.project_name__c;
                  //  obj.expenseHead = eachRecord.expense_head_category__c;
                    obj.description = eachRecord.description__c;
                    obj.actualExpenseFromTally = eachRecord.actual_expense_from_tally__c != null ? eachRecord.actual_expense_from_tally__c.toFixed(2) : eachRecord.actual_expense_from_tally__c;
                    obj.planned_annual_budget__c= eachRecord.planned_annual_budget__c != null ? eachRecord.planned_annual_budget__c.toFixed(2): eachRecord.planned_annual_budget__c;
                    obj.estimated_expense_from_tasks= eachRecord.estimated_expense_from_tasks__c != null ? eachRecord.estimated_expense_from_tasks__c.toFixed(2): eachRecord.estimated_expense_from_tasks__c;
                    obj.createdDate = strDate;
                    i = i + 1;
                    modifiedList.push(obj);
                })
                response.send(modifiedList);
            }
            else {
                response.send([]);
            }
        })
        .catch((error) => {
            console.log('error  : ' + error.stack);
            response.send('Error Occurred !');
        })
})
router.post('/updateActivityCode', (request, response) => {
    let body = request.body;
    console.log('body  : ' + JSON.stringify(body));
    const { name, project, activityCodeName, hide, expenseHead, description } = request.body;
    console.log('ActivityCode id  ' + hide);
    console.log('request body=======  ', request.body);

    schema = joi.object({
        expenseHead: joi.string().required().label('Please Enter Expense Head Category'),
        name: joi.string().required().label('Please Fill Activity Code')
    })
    result = schema.validate({ expenseHead: expenseHead, name: name });

    if (result.error) {
        console.log('fd' + result.error);
        response.send(result.error.details[0].context.label);
    }
    else {
        let updateQuerry = 'UPDATE salesforce.Activity_Code__c SET ' +
            'Name = \'' + name + '\', ' +
            'Activity_Code_Name__c = \'' + activityCodeName + '\', ' +
            'Expense_Head_Category__c = \'' + expenseHead + '\', ' + 'Description__c = \'' + description + '\' ' + 'WHERE sfid = $1';
        console.log('updateQuerry  ' + updateQuerry);
        pool
            .query(updateQuerry, [hide])
            .then((updateQuerryResult) => {
                console.log('updateQuerryResult =>>' + JSON.stringify(updateQuerryResult));
                response.send('Success');
            })
            .catch((updatetError) => {
                console.log('updatetError' + updatetError.stack);
                response.send('Error');
            })
    }
})

router.get('/getProjects',verify,(request,response)=>{
    let task= request.query.type;
    let sfid = request.user.sfid;
    console.log('userer data',sfid)
    console.log('taskk>>>>>>> typee',task)
    let recordDeatil= {};
    if(task=='ActivityCode'){
        pool.query('select Project_Name__c, Project__c ' +
                    'FROM salesforce.Heroku_Visibility__c where hasActivityCodeAccess__c=true AND To_Contact__c = $1 ',[sfid])
                .then((projectList) => {
                    console.log('ten description =>' + JSON.stringify(projectList.rows));
                    recordDeatil.project = projectList.rows;
                    response.send(recordDeatil)
                })
                .catch((error) => {
                    console.log('error ' + error.stack);
                    response.send(error);
                })
    }else{
        pool.query('select Project_Name__c, Project__c ' +
                    'FROM salesforce.Heroku_Visibility__c where hasTaskAccess__c =true AND To_Contact__c = $1 ',[sfid])
                .then((projectList) => {
                    console.log('ten description =>' + JSON.stringify(projectList.rows));
                    recordDeatil.project = projectList.rows;
                    response.send(recordDeatil)
                })
                .catch((error) => {
                    console.log('error ' + error.stack);
                    response.send(error);
                })
    }

})

router.post('/createActivityCode', (request, response) => {
    let body = request.body;
    console.log('body  : ' + JSON.stringify(body));
    const { name, projectDropdown, activityCodeName, expenseHeadDropdown, description } = request.body;
    console.log('request body=======  ', request.body);

    schema = joi.object({
        expenseHeadDropdown: joi.string().required().label('Please Enter Expense Head Category'),
        name: joi.string().required().label('Please Fill Activity Code')
    })
    result = schema.validate({ expenseHeadDropdown: expenseHeadDropdown, name: name });
    if (result.error) {
        console.log('fd' + result.error);
        response.send(result.error.details[0].context.label);
    }
    else {
        pool
            .query('INSERT INTO salesforce.Activity_Code__c (Name, Activity_Code_Name__c, Expense_Head_Category__c, Description__c,Project__c ) values ($1,$2,$3,$4,$5)',[name, activityCodeName, expenseHeadDropdown, description,projectDropdown])
            .then((updateQuerryResult) => {
                console.log('updateQuerryResult =>>' + JSON.stringify(updateQuerryResult));
                response.send('Success');
            })
            .catch((updatetError) => {
                console.log('updatetError' + updatetError.stack);
                response.send('Error');
            })
    }
})
router.get('/getActivityCodeDetails', async (request, response) => {
    let activityCode = request.query.activityCodeId;
    console.log('activityCode ' + activityCode);

    let qry = '';
    console.log('qry Detail =>' + qry);
    let recordDeatil = {};
    await
        pool
            .query('select sfid ,Name,Activity_Code_Name__c,Project_Name__c,Expense_Head_Category__c,Description__c,Actual_Expense_on_Salesforce__c,Actual_Expense_from_tally__c,Estimated_Expense_from_Tasks__c,Actual_Expense_from_Procurement__c,Estimated_expenditure_till_current_date__c,Grant_Utlization__c,Actual_Hours_from_tasks__c,Planned_Annual_Budget__c,Actual_Utilization_against_annual_budget__c,Actual_Expense_on_Tally_Date__c  ' +
                'FROM salesforce.Activity_Code__c where sfid =$1 ', [activityCode])
            .then((queryResult) => {
                console.log('queryResult +>' + JSON.stringify(queryResult.rows));
                recordDeatil.ActivityCodeDetail = queryResult.rows;
                recordDeatil.ActivityCodeDetail[0].grant_utlization__c = recordDeatil.ActivityCodeDetail[0].grant_utlization__c != null ? recordDeatil.ActivityCodeDetail[0].grant_utlization__c + '%' : recordDeatil.ActivityCodeDetail[0].grant_utlization__c;
                if(recordDeatil.ActivityCodeDetail[0].actual_expense_on_tally_date__c !=null){
                    let crDate = new Date(recordDeatil.ActivityCodeDetail[0].actual_expense_on_tally_date__c);
                        crDate.setHours(crDate.getHours() + 5);
                        crDate.setMinutes(crDate.getMinutes() + 30);
                        let strDate = crDate.toLocaleString();
                    recordDeatil.ActivityCodeDetail[0].actual_expense_on_tally_date__c= formatDate(strDate.split(',')[0])
                }
                console.log('record ' + recordDeatil);

                //response.send(queryResult.rows);
            })
            .catch((error) => {
                console.log('error =>' + JSON.stringify(error.stack));
                response.send(error);
            })
    await
        pool
            .query('select sfid ,name,Task_Stage__c,Project_Name2__c	,Activity_Codes__c,Activity_Code_Name__c,Project_Task_Category_Name__c ' +
                'FROM salesforce.Milestone1_Task__c where Activity_Codes__c=$1', [activityCode])
            .then((taskdescriptionQueryy) => {
                console.log('ten description =>' + JSON.stringify(taskdescriptionQueryy.rows));
                recordDeatil.task = taskdescriptionQueryy.rows;
            })
            .catch((error) => {
                console.log('error ' + error.stack);
                response.send(error);
            })
    console.log('reccord' + recordDeatil);
    response.send(recordDeatil);
})

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

module.exports = router;