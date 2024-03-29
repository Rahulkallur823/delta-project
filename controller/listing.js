const Listing = require("../models/listing.js")
const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxgeocoding({ accessToken: mapToken });
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render('listings/index.ejs', { allListings });
}
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs")
}

module.exports.ShowListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews").populate("owner");
    if (!listing) {
        req.flash("error", "listing you are requested for not existed");
        res.redirect("/listings")
    }
    console.log(listing)
    res.render('listings/show.ejs', { listing });
}

module.exports.createListing = async (req, res, next) => {


    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    }).send();



    let url = req.file.path;
    let filename = req.file.filename;
    console.log(url)
    console.log(filename)
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename }
    newListing.geometry = response.body.features[0].geometry;

    let savedlistings = await newListing.save();
    console.log(savedlistings)
    req.flash("success", "newListing created successfully")
    res.redirect('/listings');
}


module.exports.renderEditForm = async (req, res) => {

    let { id } = req.params;
    const listing = await Listing.findById(id).populate('reviews');

    if (!listing) {
        req.flash("error", "listing you are requested for not existed");
        res.redirect("/listings")
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render('listings/edit.ejs', { listing, originalImageUrl });
}





module.exports.updateListing = async (req, res) => {

    let { id } = req.params;
    // let listing = await Listing.findById(id);
    // if(!listing.owner.equals(res.locals.currUser._id)){

    //     req.flash("error","you dont have permission")
    //    return  res.redirect(`/listings/${id}`);

    // }
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "listing updated!")
    res.redirect(`/listings/${id}`);
}


module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletelisting = await Listing.findByIdAndDelete(id);
    console.log(deletelisting);
    req.flash("success", "successfully deleted!")
    res.redirect('/listings');
}