const express = require('express');
const router = express.Router();

const Note = require('../models/Notes');
const fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');

//Route 1: Get all the notes: GET "/api/notes/getallnotes"> Login required
router.get('/fetchallnotes', fetchuser, async (req, res) => {

    try {
        const notes = await Note.find({ user: req.user.id });
        res.json(notes);
    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error!");
    }
})

//Route 2: Add a new note: POST "/api/notes/addnote"> Login required
router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid title').isLength({ min: 3 }),
    body('description', 'Description must be atleast of 5 characters').isLength({ min: 5 })], async (req, res) => {


        // if errors, return bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { title, description, tag } = req.body;
            const note = new Note({
                title,
                description,
                tag,
                user: req.user.id
            })
            const savedNote = await note.save();
            res.json(savedNote);

        } catch (error) {
            console.log("Error:", error);
            res.status(500).send("Internal Server Error!");
        }
    })

//Route 3: update an existing note: PUT "/api/notes/updatenote/:id"> Login required
router.put('/updatenote/:id', fetchuser, async (req, res) => {

    const { title, description, tag } = req.body;
    try {
        // create new note onject
        const newNote = {};
        if (title) {
            newNote.title = title
        }
        if (description) {
            newNote.description = description
        }
        if (tag) {
            newNote.tag = tag
        }
        // find the note to be updated and then update it
        let note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send("Not Found");
        }
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true });
        res.json(note);

    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error!");
    }

})


//Route 4: delete an existing note: DEL "/api/notes/deletenote/:id"> Login required
router.delete('/deletenote/:id', fetchuser, async (req, res) => {

    try {
        // find the note to be deleted and then delete it
        let note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).send("Not Found");
        }
        //allow deletion only if user owns the note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        note = await Note.findByIdAndDelete(req.params.id);
        res.json({ "Success": "Note has been deleted!", "note": note });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).send("Internal Server Error!");
    }
})

module.exports = router;