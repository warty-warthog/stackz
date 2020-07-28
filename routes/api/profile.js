const express = require('express');
const Router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// @Route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
Router.get('/me', auth, async (req,res) => {
  try {
    // req.user is used here because it can be accessed anywhere
    // .populate references the 'name' and 'avatar' in the 'users' collection
    // 'User' has a capital u because that was how i named the model, but when querying,
    // it becomes 'users'
    const profile = await Profile.findOne({ user: req.user.id }).populate('User', ['name, avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' })
    }
    res.json(profile);
  } catch (e) {
    console.log(e.message);
    res.status(500).send('Server error')
  }
});


// @Route   POST api/profile
// @desc    Create or Update user profile
// @access  Private

// In order to use more than one middleware, you must put them in an array
Router.post('/', [auth, [
  // 'status' refers to the field to be checked
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'Skills is required').not().isEmpty()
]], async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body

  // Build profile fields
  const profileFields = {};
  profileFields.user = req.user.id;
  if(company) profileFields.company = company;
  if(website) profileFields.website = website;
  if(location) profileFields.location = location;
  if(bio) profileFields.bio = bio;
  if(status) profileFields.status = status;
  if(githubusername) profileFields.githubusername = githubusername;
  if(skills) {
    // skills would now be turned into an array because currently it is a string
    // the .split(', ') method turns a string into an array, and this case the
    // delimiter is a comma
    // It is turned into an array because in the Profile Schema, the type was defined
    // type: [String], so it must be converted into an array
    // .trim() was used to remove all spaces around a skill
    profileFields.skills = skills.split(',').map(skill => skill.trim());
    // console.log(profileFields);
  }

  // Build social object
  profileFields.social = {};
  if(youtube) profileFields.social.youtube = youtube;
  if(facebook) profileFields.social.facebook = facebook;
  if(twitter) profileFields.social.twitter = twitter;
  if(instagram) profileFields.social.instagram = instagram;
  if(linkedin) profileFields.social.linkedin = linkedin;

  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate({ user: req.user.id }, {
        $set: profileFields
      }, { new: true });

      return res.json(profile);
    } else {
      // Create
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    }

  } catch (e) {
    console.log(e.message);
    res.status(500).send('Server Error');
  }

})


module.exports = Router;
