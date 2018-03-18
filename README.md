# nedb-rest
REST API for [NeDB](https://github.com/louischatriot/nedb) database, based on [express](http://expressjs.com/) HTTP server.

The API enables client sided javascript components to access database content via HTTP RESTful calls.
This can be used i.e. for HTML5 applications.

## Quick start
Following code snippet starts an express server, which serves nedb api at port 8010.

```
npm install nedb-rest
nedb-rest
```

The authenticated account and password are all admin. You can edit `options.json` to modify it.

```
cp node_modules/nedb-rest/options.json ./
```

## API schema

The module can be connected to multiple NeDB data storages, which are called *collections*.
Each [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) command is a combination of a HTTP method (GET, POST, PUT, DELETE), URL and HTTP-body.
The following table gives a quick overview of possible commands.

| URL              | Method | Notes                                                                    |
|----------------- | ------ | ------------------------------------------------------------------------ |
| /nedb                | GET    | get list of collections (= datastores)                                   |
| /nedb/:collection     | GET    | search documents in a collection (uses query parameter $filter $sort) |
| /nedb/:collection/:id | GET    | retrieve a single document                                               |
| /nedb/:collection     | POST   | create a single document                                                 |
| /nedb/:collection/:id | PUT    | update a single document                                                 |
| /nedb/:collection     | PUT    | update multiple documents (uses query parameter $filter)                 |
| /nedb/:collection/:id | DELETE | remove single a document                                                 |
| /nedb/:collection     | DELETE | remove multiple documents (uses query parameter $filter)                 |

## <a name="creating-documents">Creating Documents</a>
To create a document, use a POST call and put the document into HTTP body. You can only insert one document per call.
Each document must have a unique key value, which is named '_id'. If you don't define an _id,
NeDB will generate a 16 character long string as _id. Please refer to [NeDB documentation](https://github.com/louischatriot/nedb#inserting-documents).
On success the server will respond with status code 201, and the body contains the created document as JSON string.

## <a name="reading-documents">Reading Documents</a>
Read operation are done by HTTP GET calls. You can read a single document by appending the document _id to the URL.
In this case the server will respond with the document as JSON string.

```
HTTP GET /nedb/fruits/J1t1kMDp4PWgPfhe
```

You can also query multiple documents and set a [$filter](#$filter) as parameter. In that case the response contains an array of document objects (JSON formatted).
You may also get an empty array, if no document matches the filter. The result can be sorted with parameter [$sort](#$sort)

```
HTTP GET /nedb/fruits?$filter={"price":{"$lt":3.00}}&$sort={"price":-1}
```

## <a name="updating-documents">Updating Documents</a>
Updating operations are done by HTTP PUT calls. You can update a single document by appending the document key (_id) to URL.
You must provide the document in HTTP body as JSON string. You cannot change key field (_id).
The document will be completely overwritten with the new content.

If you don't want to update every field of the document, but only change some of them, you have to use a special [NeDB syntax](https://github.com/louischatriot/nedb#updating-documents).
There are operations $set, $unset, $inc and more, to update a field.

```
HTTP PUT /nedb/fruits/J1t1kMDp4PWgPfhe
{"$set":{"discount":0.12}}
```

You can also update multiple documents by calling a PUT command without _id. You should define a [$filter](#$filter), otherwise all documents are changed.
Changing multiple documents makes only sense in combination with update operations like $set. Otherwise all documents of a collection will have the same content.

```
HTTP PUT /nedb/fruits?$filter={"name":{"$regex":"berry"}}
{"$set":{"discount":0.12}}
```

## <a name="deleting-documents">Deleting Documents</a>
Documents can be deleted by HTTP DELETE calls. You can delete a single document by appending the document key (_id) to the URL.

```
HTTP DELETE /nedb/fruits/J1t1kMDp4PWgPfhe
```

If you omit the _id, you must define [$filter](#$filter) parameter, to specify a subset of documents.
Otherwise the server will respond with error status 405. This shall protect you to delete all documents by accident.

```
HTTP DELETE /nedb/fruits?$filter={"name":{"$regex":"berry"}}
```

## <a name="$filter">Query parameter $filter</a>
The $filter parameter is used, to define a subset of documents of a collection.
Filter may be used for [reading](#reading-documents) (GET), [updating](#updating-documents) (PUT)
and [deleting](#deleting-documents) (DELETE) commands.

A filter consists of one or more conditions, which are linked with logical and/or operations.
Filters are set by the $filter parameter. The string will be parsed and transformed to a NeDB filter object.
Filters has format <fieldname> <operator> <value>. Values may be a String, Boolean, Number, Date or Array.

If you compare with a date value, please define it as ISO-8601 string (i.e. 2017-04-06T08:39:44.016Z).

For the operators $in and $nin an array must be given as value. Currently this array cannot obtain a single value.
Arrays are delimited by `,`. Another constraint is that an array can only contain a single type of either String of Number.
The array `1,2,hello` will not work.

Here is a list of valid operations. For more informations please consult [NeDB documentation](https://github.com/louischatriot/nedb#operators-lt-lte-gt-gte-in-nin-ne-exists-regex).

Examples:

```HTTP GET /nedb/fruits?$filter={"color":"red"}```

```HTTP GET /nedb/fruits?$filter={"color":{"$in":["red","blue"]}}```


## <a name="$sort">Query parameter $sort</a>
You may sort the result of a query with "$sort" parameter.
You can use it in [reading](#reading-documents) (GET) operations only.
The parameter may contain multiple fieldnames concatenated by commas (,).
Each fieldname can be followed by keyword `1` or `-1` to define sorting direction.
Ascending is default direction, so you may omit it.

Examples:

```HTTP GET /nedb/fruits?$sort={"price":1}```

```HTTP GET /nedb/fruits?$filter={"color":"red"}&$sort={"price":1}```

## <a name="$count">Query parameter $count</a>
If you append $count parameter to a query, the server returns the number of of matching documents instead of a result set.
You can use this parameter in [reading](#reading-documents) (GET) operations only.
The server responds with a number (no JSON object or array).

Example:

```HTTP GET /nedb/fruits?$filter={"name":"apple"}&$count```

## <a name="pagination">Query parameter $skip and $limit</a>
If you want to fetch results in several packages, you may use pagination parameters $skip and $limit.
They should be used together with [$sort](#$sort) parameter.  
Parameter $skip sets the count of documents, which will be deleteted from the beginning of result set.  
Parameter $limit sets maximal count of documents in the result set.  
You can use this parameter in [reading](#reading-documents) (GET) operations only.

Example:

```HTTP GET /nedb/fruits?$filter={"name":"apple"}&$skip=1&$limit=2```

## <a name="$single">Query parameter $single</a>
If you read from collections with HTTP GET, the result will be always an array of documents, 
even if you use query parameter [$limit](#pagination)=1, or only one docment matches the [$filter](#$filter). 

If you prefer to get a single object but not an array, you must use query parameter $single instead.
The NeDB database will be queried with function ´findOne´, and you will get only one document as JSON object. 
If your query finds no document, you will get a 404-error code, instead of an empty array.

Example:

```HTTP GET /nedb/fruits?$filter={"name":"apple"}&$single```

## <a name="Serialize">Serialize and Unserialize</a>

Normally, the $filter, $option, $sort and body data needs to be serialized. And response data needs to be unserialized.
You can use the following tools to do these operations.

```var util = require('nedb-rest/main/util');```
