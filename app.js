//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.a1bla.mongodb.net/todolistDB?retryWrites=true&w=majority`
);

// Mongoose Schemas
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: "Enter todo item",
  },
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

// Mongoose Models
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// Default items
const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item" });
const item3 = new Item({ name: "Select to delete the item" });

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) =>
        err
          ? console.log(err)
          : console.log("Successfully saved default items to DB.")
      );
      res.redirect("/");
    }
    res.render("list", {
      listTitle: "Today",
      newListItems: foundItems,
    });
  });
});

app.get("/:listTitle", function (req, res) {
  const listTitle = _.capitalize(req.params.listTitle);
  List.findOne({ name: listTitle }, (err, foundList) => {
    if (!foundList) {
      // Create a new list
      const newList = new List({
        name: listTitle,
        items: defaultItems,
      });
      newList.save();
      res.redirect("/" + listTitle);
    } else {
      // Show an existing list
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({ name: itemName });
  if (listTitle === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listTitle);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.listTitle;
  if (listTitle === "Today") {
    Item.deleteOne({ _id: checkedItemId }, (err) =>
      err ? console.log(err) : res.redirect("/")
    );
  } else {
    List.findOneAndUpdate(
      { name: listTitle },
      { $pull: { items: { _id: checkedItemId } } },
      (err) => res.redirect("/" + listTitle)
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT, function () {
  console.log("Server has started");
});
