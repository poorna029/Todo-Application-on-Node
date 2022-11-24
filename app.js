const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;
let db = null;
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const da = new Date(2021, 2, 15);
const { format } = require("date-fns");
var isValid = require("date-fns/isValid");
// console.log(da);
const initDBandServer = async () => {
  //   console.log("hi");
  try {
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000 ");
    });
    db = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (e) {
    console.log(`DBerror ${e.Message}`);
    process.exit(1);
  }
};
initDBandServer();
const priority_list = ["%%", "LOW", "MEDIUM", "HIGH"];
const status_list = ["%%", "TO DO", "IN PROGRESS", "DONE"];
const category_list = ["%%", "WORK", "HOME", "LEARNING"];

//   -------------------->>>

app.get("/todos/", async (request, response) => {
  const { priority = "%%", status = "%%", category = "%%" } = request.query;
  //   priority_list = ["%%", "LOW", "MEDIUM", "HIGH"];
  //   status_list = ["%%", "TO DO", "IN PROGRESS", "DONE"];
  //   category_list = ["%%", "WORK", "HOME", "LEARNING"];

  const is_priority_contains = priority_list.includes(priority);
  const is_status_contains = status_list.includes(status);
  const is_category_contains = category_list.includes(category);

  if (
    is_priority_contains === true &&
    is_status_contains === true &&
    is_category_contains === true
  ) {
    let { search_q = "%%" } = request.query;
    if (search_q !== "%%") {
      search_q = `%${search_q}%`;
    }
    let { date = "due_date" } = request.query;
    if (date !== "due_date") {
      date = format(new Date(date), "yyyy-MM-dd");
    }
    // console.log(search_q);
    const todos_list_qry = `select id,todo,priority,status,
        category,due_date as dueDate from todo where todo like "${search_q}" and
        priority like "${priority}" and status like "${status}" and 
        category like "${category}" and due_date ="${date}"        ;`;

    // console.log(todos_list_qry);
    try {
      const todo_lis = await db.all(todos_list_qry);
      //   console.log(todo_lis);
      response.send(todo_lis);
    } catch (e) {
      response.status(400);
      console.log(`${e.Message}`);
    }
  } else if (is_priority_contains === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (is_status_contains === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (is_category_contains === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
});

// get todo_onID    -------------------------------------->>>

app.get("/todos/:id", async (request, response) => {
  const { id } = request.params;
  const todo_onID_qry = `select id,todo,priority,status,
        category,due_date as dueDate from todo where id=${id};`;
  const toDO = await db.get(todo_onID_qry);
  //   console.log(todo_onID_qry);
  //   console.log(toDO);
  response.send(toDO);
});

// get todo_onDate   ------------------------------------->>>

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;

  const y = new Date(date);
  let x = y.getFullYear();
  let a = y.getMonth();
  let b = y.getDate();
  //   console.log(x, a, b);
  let isValidDate;
  if (Number.isNaN(a) || a === 0 || b == 0) {
    isValidDate = false;
  } else {
    isValidDate = isValid(new Date(date));
    date = format(new Date(date), "yyyy-MM-dd");
  }

  if (isValidDate === true) {
    const todo_onID_qry = `select id,todo,priority,status,
        category,due_date as dueDate from todo where due_date="${date}";`;
    const toDO = await db.all(todo_onID_qry);
    //   console.log(todo_onID_qry);
    //   console.log(toDO);
    response.send(toDO);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// api for creating a new row of data  ------------------------>>>

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category } = request.body;
  let { dueDate } = request.body;
  let d = new Date(dueDate);
  let y = d.getMonth();
  console.log(y);
  is_Valid_date = null;
  if (Number.isNaN(y)) {
    console.log("wrong");
    is_Valid_date = false;
  } else {
    is_Valid_date = isValid(new Date(dueDate));
    dueDate = format(new Date(dueDate), "yyyy-MM-dd");
  }

  //   console.log(ans);

  let output = "";
  let Err = "";
  console.log(
    priority_list.includes(priority),
    status_list.includes(status),
    category_list.includes(category),
    is_Valid_date
  );
  let reqbody = request.body;
  console.log(reqbody.status);
  if (
    priority_list.includes(priority) === true &&
    status_list.includes(status) === true &&
    category_list.includes(category) === true &&
    is_Valid_date
  ) {
    const add_todo_qry = `insert into todo(id,todo,priority,status,
        category,due_date) values(${id},"${todo}","${priority}",
        "${status}","${category}","${dueDate}");`;
    //   console.log(add_todo_qry);
    await db.run(add_todo_qry);
    response.send("Todo Successfully Added");
  } else {
    switch (true) {
      case status_list.includes(status) === false:
        output = "Todo Status";
        Err = "Status";
        break;
      case priority_list.includes(priority) === false:
        output = "Todo Priority";
        Err = "Priority";
        break;

      case category_list.includes(category) === false:
        output = "Todo Category";
        Err = "Category";
        break;
      case is_Valid_date === false:
        output = "Due Date";
        Err = "Due Date";
        break;
    }
    response.status(400);
    response.send(`Invalid ${output}`);
  }
});

// update todo api   ----------------------------------------->>>

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const todo_onID_qry = `select * from todo where id=${todoId};`;
  const toDO = await db.get(todo_onID_qry);
  //   console.log(
  //     toDO.id,
  //     toDO.todo,
  //     toDO.priority,
  //     toDO.status,
  //     toDO.category,
  //     toDO.due_date
  //   );
  const {
    id = toDO.id,
    todo = toDO.todo,
    priority = toDO.priority,
    status = toDO.status,
    category = toDO.category,
    due_date = toDO.due_date,
  } = request.body;
  let Dt_toBeUpdated =
    request.body.dueDate === undefined ? due_date : request.body.dueDate;
  let reqbody = request.body;
  let output = "";
  let error = "";

  switch (true) {
    case reqbody.status !== undefined:
      output = "Todo Status";
      Err = "Status";
      break;
    case reqbody.priority !== undefined:
      output = "Todo Priority";
      Err = "Priority";
      break;
    case reqbody.todo !== undefined:
      output = "Todo";
      Err = "Todo";
      break;
    case reqbody.category !== undefined:
      output = "Todo Category";
      Err = "Category";
      break;
    case reqbody.dueDate !== undefined:
      output = "Due Date";
      Err = "Due Date";
      break;
  }

  if (
    status_list.includes(status) === true &&
    priority_list.includes(priority) === true &&
    category_list.includes(category) === true &&
    isValid(new Date(Dt_toBeUpdated))
  ) {
    try {
      //   console.log(id, todo, priority, status, category, due_date);
      const upd_todo_qry = `update todo set id=${id},todo="${todo}",
    priority="${priority}",status="${status}",category="${category}",
    due_date="${Dt_toBeUpdated}";`;
      // console.log(upd_todo_qry);
      await db.run(upd_todo_qry);
      response.send(`${Err} Updated`);
    } catch (e) {
      console.log(`DBerror ${e.Message}`);
    }
  } else {
    response.status(400);
    response.send(`Invalid ${output}`);
  }

  console.log("hi");
});

// del todo api    ------------------------------------------->>>

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const del_todo_qry = `delete from todo where id=${todoId};`;
  await db.run(del_todo_qry);
  response.send("Todo Deleted");
});
