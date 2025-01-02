const axios = require("axios");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors());
const API_KEY = ""; // Replace with your actual API key

// Initialize the API key and model configuration
const apiKey = '';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const { MongoClient, ObjectId, Binary } = require("mongodb");
const uri =
  "mongodb+srv://swaroop:21pa1a1277@cluster0.646q6h1.mongodb.net/";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client
  .connect()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


app.get("/api/details/:placeName", async (req, res) => {
  const placeName = req.params.placeName;
  console.log(placeName);
  
  try {
    // Create a chat session
    const database = await client.db("Places");
  const collection = await database.collection("place");
  const existingPlace = await collection.findOne({ placeName });
  console.log(existingPlace);
  if(existingPlace){
    console.log("Fetched data from Database");
    res.json(existingPlace.details);
  }
  else{
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {text: "Provide comprehensive information about TajMahal in JSON format. Include the name of the place, a detailed description, an working image URL representing the place, the estimated budget for a visit, and the best time to visit, places to visit around . Include details about the nearest railway station, bus station, and airport, mentioning their names and distances from the place. Additionally, provide details about 6 hotels to stay at, including the hotel name, an image URL of the hotel, its location (address), cost per night, and rating out of 5. Ensure the information is accurate and well-structured in JSON format.\n"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "```json\n{\"TajMahal\": {\"name\": \"Taj Mahal\", \"description\": \"An ivory-white marble mausoleum on the south bank of the Yamuna river in Agra, India.  It was commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favourite wife, Mumtaz Mahal.  A symbol of eternal love, it's considered one of the finest examples of Mughal architecture and a UNESCO World Heritage site.\", \"image_url\": \"https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Taj_Mahal_seen_from_the_opposite_bank_of_the_Yamuna_River.jpg/1280px-Taj_Mahal_seen_from_the_opposite_bank_of_the_Yamuna_River.jpg\", \"estimated_budget\": {\"low\": 50, \"mid\": 150, \"high\": 500}, \"best_time_to_visit\": \"October to March\", \"places_to_visit_around\": [\"Agra Fort\", \"Fatehpur Sikri\", \"Itmad-ud-Daulah's Tomb\", \"Mehtab Bagh\"], \"transport\": {\"railway_station\": {\"name\": \"Agra Cantonment Railway Station\", \"distance\": \"5 km\"}, \"bus_station\": {\"name\": \"Agra Bus Station\", \"distance\": \"8 km\"}, \"airport\": {\"name\": \"Kheria Airport (Agra)\", \"distance\": \"10 km\"}}, \"hotels\": [{\"name\": \"The Oberoi Amarvilas, Agra\", \"image_url\": \"https://www.oberoihotels.com/images/hotels/amarvilas-agra/gallery/amarvilas-exterior.jpg\", \"location\": \"National Highway 2, Tajganj, Agra, Uttar Pradesh 282001, India\", \"cost_per_night\": 800, \"rating\": 4.8}, {\"name\": \"ITC Mughal, a Luxury Collection Resort & Spa, Agra\", \"image_url\": \"https://dynamic-media.cdn.cnn.com/api/v1/image/371249_1.jpg?q=80&w=1600&h=900&size=SzK_d6d_n0_w300\", \"location\": \"Fatehabad Road, Agra, Uttar Pradesh 282001, India\", \"cost_per_night\": 400, \"rating\": 4.5}, {\"name\": \"Hotel Taj Resorts Agra\", \"image_url\": \"https://cf.bstatic.com/xdata/images/hotel/max1024x768/260043956.jpg?k=84a665f89521a03e9025a83226668a963641822a531a603a8e4172025a1346a8&o=&hp=1\", \"location\": \"Near Taj Mahal, Agra, Uttar Pradesh, India\", \"cost_per_night\": 200, \"rating\": 4.0}, {\"name\": \"DoubleTree by Hilton Agra\", \"image_url\": \"https://www.hilton.com/en/hotels/agrhdtr-doubletree-agra/?SEO_id=GGL_Local_Hotel_DoubleTree_by_Hilton_Agra\", \"location\": \"Near Taj Mahal, Agra, Uttar Pradesh, India\", \"cost_per_night\": 150, \"rating\": 4.2}, {\"name\": \"Radisson Hotel Agra\", \"image_url\": \"https://www.radissonhotels.com/en-us/hotels/radisson-agra\", \"location\": \"Near Taj Mahal, Agra, Uttar Pradesh, India\", \"cost_per_night\": 180, \"rating\": 4.0}, {\"name\": \"Jaypee Palace Hotel Agra\", \"image_url\": \"https://www.jaypeehotels.com/images/jaypee-palace-hotel-agra-exterior.jpg\", \"location\": \"Near Taj Mahal, Agra, Uttar Pradesh, India\", \"cost_per_night\": 250, \"rating\": 4.3}]}}\n```"},
          ],
        },
      ],
    });
    const prompt=`Provide comprehensive information about ${placeName} in JSON format. Include the name of the place, a detailed description, an working image URL representing the place , the estimated budget for a visit, and the best time to visit, places to visit around . Include details about the nearest railway station, bus station, and airport, mentioning their names and distances from the place. Additionally, provide details about 6 hotels to stay at, including the hotel name, an image URL of the hotel, its location (address), cost per night, and rating out of 5. Ensure the information is accurate and well-structured in JSON format.`
    const result = await chatSession.sendMessage(prompt);
    //console.log(result.response.text());
    const newPlace = {
      placeName,
      details: result.response.text(),
      createdAt: new Date(),
    };

    await collection.insertOne(newPlace);
    console.groupCollapsed("added to db");
    console.log(result.response.text());
    res.json(result.response.text());
  }

    
  } catch (error) {
    console.error("Error fetching place information:", error.message);
    res.status(500).json({ error: "Failed to fetch place information." });
  }
  
});

app.get('/api/places', async (req, res) => {
  const { query } = req.query;
  try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: { query, key: API_KEY },
      });
      res.json(response.data);
  } catch (error) {
      console.error('Error fetching places:', error);
      res.status(500).send('Server Error');
  }
});
app.get("/api/hotels/:city", async (req, res) => {
  const placeName = req.params.city;
  console.log(placeName);
  
  try {
    const database = await client.db("Places");
  const collection = await database.collection("hotel");
  const existingPlace = await collection.findOne({ placeName });
  console.log(existingPlace);
  if(existingPlace){
    console.log("Fetched data from Database");
    res.json(existingPlace.details);
  }
  else{
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {text: "\"Provide a detailed list of the  15 best hotels in Hyderabad, including their name, rating (out of 5 or 10, along with user reviews if available), price range (cost per night in INR , address, types of cuisine offered in their restaurants, available amenities such as free Wi-Fi, pool, spa, or gym, and contact information like phone number or website. Focus on well-rated and popular hotels, and ensure the information is concise, accurate, and well-organized in JSON formate.\""},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "```json\n{\n  \"hotels\": [\n    {\n      \"name\": \"Taj Falaknuma Palace\",\n      \"rating\": \"4.7/5\",\n      \"user_review_snippets\": [\"Exceptional experience\", \"Like stepping back in time\", \"Unforgettable luxury\"],\n      \"price_range\": \"₹30,000 - ₹1,00,000+\",\n      \"address\": \"Engine Bowli, Falaknuma, Hyderabad, Telangana 500053\",\n      \"cuisine\": [\"Indian (Hyderabadi)\", \"Italian\", \"International\"],\n      \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Heritage Walk\", \"Fine Dining\", \"Butler service\"],\n      \"contact\": {\n        \"phone\": \"+91 40 6629 8585\",\n        \"website\": \"https://www.tajhotels.com/en-in/taj/taj-falaknuma-palace-hyderabad/\"\n      }\n    },\n    {\n      \"name\": \"ITC Kohenur, A Luxury Collection Hotel, Hyderabad\",\n      \"rating\": \"4.7/5\",\n       \"user_review_snippets\": [\"Impeccable service\", \"Modern and elegant\", \"Excellent dining options\"],\n      \"price_range\": \"₹15,000 - ₹40,000\",\n      \"address\": \"Plot No. 5, Knowledge City, Madhapur, Hyderabad, Telangana 500081\",\n      \"cuisine\": [\"Indian\", \"International\", \"Pan-Asian\"],\n      \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Multiple Restaurants\"],\n      \"contact\": {\n        \"phone\": \"+91 40 6766 0101\",\n        \"website\": \"https://www.marriott.com/en-us/hotels/hydlc-itc-kohenur-a-luxury-collection-hotel-hyderabad/overview/\"\n      }\n    },\n    {\n      \"name\": \"The Park Hyderabad\",\n      \"rating\": \"4.5/5\",\n      \"user_review_snippets\": [\"Stylish design\", \"Great location\", \"Good nightlife options\"],\n      \"price_range\": \"₹8,000 - ₹25,000\",\n      \"address\": \"22, Raj Bhavan Rd, Somajiguda, Hyderabad, Telangana 500082\",\n      \"cuisine\": [\"Indian\", \"Continental\", \"Italian\", \"Asian\"],\n       \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Multiple Restaurants\", \"Nightclub\"],\n      \"contact\": {\n        \"phone\": \"+91 40 4499 0000\",\n        \"website\": \"https://www.theparkhotels.com/hyderabad/overview.html\"\n      }\n    },\n   {\n      \"name\": \"Hyderabad Marriott Hotel & Convention Centre\",\n      \"rating\": \"4.4/5\",\n      \"user_review_snippets\": [\"Excellent for events\", \"Spacious rooms\", \"Good breakfast\"],\n      \"price_range\": \"₹7,000 - ₹20,000\",\n      \"address\": \"Tank Bund Road, Opposite Hussain Sagar Lake, Hyderabad, Telangana 500080\",\n      \"cuisine\": [\"Indian\", \"International\"],\n        \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Conference Facilities\"],\n      \"contact\": {\n        \"phone\": \"+91 40 2752 2999\",\n        \"website\": \"https://www.marriott.com/en-us/hotels/hydmc-hyderabad-marriott-hotel-and-convention-centre/overview/\"\n      }\n    },\n    {\n      \"name\": \"Radisson Blu Plaza Hotel Hyderabad Banjara Hills\",\n      \"rating\": \"4.3/5\",\n       \"user_review_snippets\": [\"Comfortable stay\", \"Helpful staff\", \"Good food\"],\n      \"price_range\": \"₹6,000 - ₹18,000\",\n      \"address\": \"8-2-409, Road No. 6, Banjara Hills, Hyderabad, Telangana 500034\",\n      \"cuisine\": [\"Indian\", \"Continental\", \"Chinese\"],\n      \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Multiple Restaurants\"],\n      \"contact\": {\n        \"phone\": \"+91 40 6733 1133\",\n        \"website\": \"https://www.radissonhotels.com/en-us/hotels/radisson-blu-hyderabad-banjara-hills\"\n      }\n    },\n  {\n      \"name\": \"Novotel Hyderabad Convention Centre\",\n      \"rating\": \"4.3/5\",\n      \"user_review_snippets\": [\"Great for business travelers\", \"Large convention center\", \"Good service\"],\n      \"price_range\": \"₹6,000 - ₹15,000\",\n      \"address\": \"Near HITEC City, P.O Bag 1101, Hyderabad, Telangana 500081\",\n      \"cuisine\": [\"Indian\", \"International\"],\n      \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Convention Centre\"],\n      \"contact\": {\n        \"phone\": \"+91 40 6682 4422\",\n          \"website\": \"https://all.accor.com/hotel/1048/index.en.shtml\"\n      }\n    },\n    {\n      \"name\": \"Park Hyatt Hyderabad\",\n      \"rating\": \"4.6/5\",\n      \"user_review_snippets\": [\"Luxury experience\", \"Elegant and spacious\", \"Top-notch dining\"],\n       \"price_range\": \"₹12,000 - ₹35,000\",\n      \"address\": \"Road No. 2, Banjara Hills, Hyderabad, Telangana 500034\",\n      \"cuisine\": [\"Indian\", \"Italian\", \"Pan-Asian\"],\n      \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Multiple Restaurants\"],\n      \"contact\": {\n        \"phone\": \"+91 40 4949 1234\",\n        \"website\": \"https://www.hyatt.com/en-US/hotel/india/park-hyatt-hyderabad/hydph\"\n      }\n    },\n    {\n    \"name\": \"Trident Hyderabad\",\n     \"rating\": \"4.5/5\",\n     \"user_review_snippets\": [\"Excellent service\", \"Modern and well-maintained\", \"Great location near Hitech City\"],\n     \"price_range\": \"₹10,000 - ₹28,000\",\n     \"address\": \"Hitec City, Madhapur, Hyderabad, Telangana 500081\",\n     \"cuisine\": [\"Indian\", \"Continental\", \"Japanese\"],\n     \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Fine Dining\"],\n     \"contact\":{\n       \"phone\": \"+91 40 6623 2323\",\n       \"website\": \"https://www.tridenthotels.com/hyderabad\"\n      }\n   },\n    {\n      \"name\": \"The Westin Hyderabad Mindspace\",\n      \"rating\": \"4.4/5\",\n      \"user_review_snippets\": [\"Comfortable stay\", \"Good for business trips\", \"Relaxing atmosphere\"],\n       \"price_range\": \"₹9,000 - ₹24,000\",\n      \"address\": \"Raheja IT Park, Mindspace, Hitec City, Madhapur, Hyderabad, Telangana 500081\",\n      \"cuisine\": [\"Indian\", \"International\", \"Italian\"],\n       \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\"],\n      \"contact\": {\n        \"phone\": \"+91 40 6767 6767\",\n        \"website\": \"https://www.marriott.com/en-us/hotels/hydwi-the-westin-hyderabad-mindspace/overview/\"\n      }\n    },\n    {\n    \"name\": \"Vivanta Hyderabad, Begumpet\",\n    \"rating\": \"4.4/5\",\n    \"user_review_snippets\": [\"Excellent hospitality\", \"Centrally located\", \"Good dining experience\"],\n    \"price_range\": \"₹7,000 - ₹20,000\",\n     \"address\": \"1-8-310/20/21, Begumpet, Hyderabad, Telangana 500016\",\n     \"cuisine\": [\"Indian\", \"Continental\", \"South Indian\"],\n     \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\"],\n     \"contact\":{\n       \"phone\": \"+91 40 6725 2626\",\n       \"website\": \"https://www.tajhotels.com/en-in/vivanta/hyderabad-begumpet/\"\n       }\n    },\n {\n      \"name\": \"Aloft Hyderabad Hitec City\",\n      \"rating\": \"4.3/5\",\n      \"user_review_snippets\": [\"Modern and trendy\", \"Good for younger travellers\", \"Value for money\"],\n      \"price_range\":\"₹5,000- ₹12,000\",\n      \"address\": \"Plot No. 14 & 15, Hitec City Madhapur, Hyderabad, Telangana 500081\",\n      \"cuisine\":[\"International\",\"Indian\"],\n      \"amenities\":[\"Free Wi-Fi\",\"Gym\",\"Pool\",\"Bar\"],\n      \"contact\":{\n        \"phone\":\"+91 40 6604 8888\",\n        \"website\":\"https://www.marriott.com/en-us/hotels/hydal-aloft-hyderabad-hitec-city/overview/\"\n      }\n    },\n     {\n      \"name\": \"Sheraton Hyderabad Hotel\",\n      \"rating\": \"4.2/5\",\n      \"user_review_snippets\":[\"Comfortable rooms\", \"Good for business\",\"Efficient service\"],\n       \"price_range\": \"₹7,000- ₹18,000\",\n       \"address\": \"Financial District, Gachibowli, Hyderabad, Telangana 500032\",\n       \"cuisine\":[\"Indian\",\"International\",\"Italian\"],\n      \"amenities\":[\"Free Wi-Fi\",\"Pool\",\"Spa\",\"Gym\"],\n      \"contact\":{\n        \"phone\":\"+91 40 4925 1111\",\n        \"website\":\"https://www.marriott.com/en-us/hotels/hydsi-sheraton-hyderabad-hotel/overview/\"\n        }\n    },\n   {\n        \"name\": \"ITC Kakatiya, a Luxury Collection Hotel, Hyderabad\",\n        \"rating\": \"4.5/5\",\n         \"user_review_snippets\": [\"Luxury and style\", \"Excellent service\", \"Great food experience\"],\n        \"price_range\": \"₹10,000 - ₹30,000\",\n        \"address\": \"6-3-1187, Begumpet, Hyderabad, Telangana 500016\",\n        \"cuisine\": [\"Indian\", \"International\"],\n       \"amenities\": [\"Free Wi-Fi\", \"Pool\", \"Spa\", \"Gym\", \"Multiple Dining Options\"],\n        \"contact\": {\n          \"phone\": \"+91 40 4008 1818\",\n         \"website\":\"https://www.marriott.com/en-us/hotels/hydkl-itc-kakatiya-a-luxury-collection-hotel-hyderabad/overview/\"\n        }\n    },\n    {\n      \"name\": \"Daspalla Hyderabad\",\n      \"rating\": \"4.1/5\",\n      \"user_review_snippets\": [\"Good value\", \"Friendly staff\", \"Convenient location\"],\n       \"price_range\": \"₹4,000-₹10,000\",\n       \"address\":\"Surya Bagh, Nagarjuna Hills, Panjagutta, Hyderabad, Telangana 500082\",\n       \"cuisine\":[\"Indian\",\"Chinese\",\"Continental\"],\n       \"amenities\":[\"Free Wi-Fi\",\"Gym\",\"Multiple Dining Options\"],\n        \"contact\":{\n         \"phone\":\"+91 40 6766 8888\",\n         \"website\":\"https://www.daspallahotels.com/hyderabad/\"\n        }\n    },\n      {\n      \"name\":\"The Golkonda Hotel\",\n      \"rating\":\"4.2/5\",\n      \"user_review_snippets\":[\"Spacious rooms\",\"Good food\",\"Nice ambiance\"],\n      \"price_range\":\"₹5,000- ₹15,000\",\n      \"address\": \"10-1-124, Masab Tank, Hyderabad, Telangana 500028\",\n      \"cuisine\":[\"Indian\",\"Continental\",\"Chinese\"],\n      \"amenities\":[\"Free Wi-Fi\",\"Pool\",\"Gym\",\"Multiple Restaurants\"],\n       \"contact\":{\n          \"phone\":\"+91 40 6602 0101\",\n         \"website\":\"https://www.thegolkondahotel.com/\"\n       }\n    }\n  ]\n}\n```\n"},
          ],
        },
      ],
    });
    const prompt=`Provide a detailed list of the  15 best hotels in ${placeName}, including their name, rating (out of 5 or 10, along with user reviews if available), price range (cost per night in INR , address, types of cuisine offered in their restaurants, available amenities such as free Wi-Fi, pool, spa, or gym, and contact information like phone number or website. Focus on well-rated and popular hotels, and ensure the information is concise, accurate, and well-organized in JSON formate.`
    const result = await chatSession.sendMessage(prompt);
    //console.log(result.response.text());
    const newPlace = {
      placeName,
      details: result.response.text(),
      createdAt: new Date(),
    };

    await collection.insertOne(newPlace);
    console.groupCollapsed("added to db hotel");
    console.log(result.response.text());
    res.json(result.response.text());
  }

    
  } catch (error) {
    console.error("Error fetching place information:", error.message);
    res.status(500).json({ error: "Failed to fetch place information." });
  }
  
});

app.post("/api/trip", async(req, res) => {
  const data = req.body; 
  console.log(data.experience);
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {text: "\"Using the user's input from the trip recommendation form, where they have selected **[Type of Experience: Cultural]**, specified their preferred activities such as **[Activity Preferences: Nightlife]**, and mentioned their travel companions as **[Travel Companions: Solo]**, generate a detailed and personalized travel plan in JSON format. Begin with an overview of the recommended destination, explaining why it aligns with their preferences for experience type and activities. Create a day-by-day detailed itinerary tailored to the selected duration of **[Trip Duration: 2-3 days]**, incorporating their chosen activities and companions. Suggest accommodations based on **[Preferred Accommodation: Budget Hotels]** that fit their specified budget of **[Budget: Low]**, including a list of hotels with the following details: name, address, cuisine offered, estimated budget in INR, and what the hotel is famous for. Provide tips for transportation, best travel dates **([Travel Dates: 01/01/2025 - 01/02/2025])**, and highlight local cuisines to try. Include additional recommendations such as packing tips, cultural insights, local festivals happening during the travel dates, and safety precautions. Ensure the JSON output is structured and contains all the required details to make the trip both seamless and enjoyable, offering a perfect balance of relaxation and adventure.\""},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "```json\n{\n  \"trip_summary\": {\n    \"destination\": \"Vienna, Austria\",\n    \"overview\": \"Vienna offers a superb blend of rich cultural history and a sophisticated nightlife, perfectly suited for a solo traveler. The city is renowned for its imperial palaces, museums, and classical music scene, providing ample opportunities for cultural immersion. Simultaneously, Vienna boasts a stylish and diverse nightlife with traditional wine taverns, elegant cocktail bars, and vibrant clubs. Its safety, efficient public transportation, and walkable city center also make it ideal for solo exploration.\",\n     \"user_preferences\": {\n      \"type_of_experience\": \"Cultural\",\n      \"activity_preferences\": \"Nightlife\",\n      \"travel_companions\": \"Solo\",\n      \"trip_duration\": \"2-3 days\",\n      \"preferred_accommodation\": \"Budget Hotels\",\n      \"budget\": \"Low\",\n       \"travel_dates\": \"01/01/2025 - 01/02/2025\"\n    }\n  },\n  \"itinerary\": {\n    \"day1\": {\n      \"date\":\"01/01/2025\",\n      \"theme\": \"Imperial Grandeur and Traditional Cafes\",\n      \"morning\": {\n        \"time\": \"9:00 AM\",\n        \"activity\": \"Begin at the Schönbrunn Palace, explore the palace and its stunning gardens.\",\n         \"notes\":\"Consider booking your tickets in advance.\"\n      },\n      \"midday\": {\n        \"time\": \"12:00 PM\",\n        \"activity\": \"Enjoy a traditional Viennese lunch at a local 'Gasthaus' (traditional restaurant) near Schönbrunn.\",\n         \"notes\":\"Try a Schnitzel or Tafelspitz.\"\n      },\n      \"afternoon\": {\n        \"time\": \"2:00 PM\",\n        \"activity\": \"Explore the Hofburg Palace, the former imperial winter residence, and its museums.\",\n         \"notes\":\"Allow time to explore the different areas.\"\n      },\n       \"late_afternoon\":{\n         \"time\":\"4:00 PM\",\n         \"activity\":\"Visit St. Stephen's Cathedral (Stephansdom), a gothic masterpiece in the heart of Vienna.\",\n         \"notes\":\"Climb the tower for great city views.\"\n       },\n      \"evening\": {\n        \"time\": \"7:00 PM\",\n        \"activity\": \"Have dinner at a traditional Viennese restaurant in the city center.\",\n         \"notes\":\"Explore the variety of dining options.\"\n      },\n      \"night\": {\n        \"time\": \"9:00 PM\",\n        \"activity\": \"Experience the Viennese nightlife by visiting a wine tavern (Heuriger) or a cocktail bar.\",\n        \"notes\": \"Enjoy traditional Viennese hospitality\"\n      }\n    },\n    \"day2\": {\n       \"date\":\"02/01/2025\",\n      \"theme\": \"Art, Music, and Danube Views\",\n      \"morning\": {\n        \"time\": \"9:00 AM\",\n        \"activity\": \"Visit the MuseumsQuartier, a complex housing several museums including the Leopold Museum and the MUMOK.\",\n         \"notes\":\"Choose a museum based on your preferences.\"\n      },\n      \"midday\": {\n        \"time\": \"1:00 PM\",\n        \"activity\": \"Have lunch at a cafe or restaurant in the MuseumsQuartier area.\",\n         \"notes\":\"Various different options for lunch here.\"\n      },\n      \"afternoon\":{\n          \"time\":\"2:30 PM\",\n         \"activity\":\"Attend a classical music concert or opera (check schedules and book in advance), a must-do in Vienna.\",\n          \"notes\":\"Experience the rich culture of the city.\"\n      },\n        \"late_afternoon\":{\n         \"time\":\"4:30 PM\",\n          \"activity\":\"Take a stroll along the Danube River and enjoy the views.\",\n           \"notes\":\"Relax by the river and enjoy the peace and quiet\"\n        },\n      \"evening\": {\n        \"time\": \"7:00 PM\",\n        \"activity\": \"Have dinner in the vibrant area near the Naschmarkt market, known for its diverse culinary scene.\",\n          \"notes\":\"Explore the various dining options here.\"\n      },\n      \"night\": {\n        \"time\": \"9:00 PM\",\n        \"activity\": \"Explore the nightlife scene around the Bermuda Triangle or in a hidden bar in a less touristy district.\",\n        \"notes\": \"There are many great options to explore for the solo traveller.\"\n      }\n    },\n     \"day3\":{\n        \"date\":\"03/01/2025\",\n       \"theme\": \"Departure or Extended Exploration\",\n        \"morning\":{\n          \"time\":\"9:00 AM\",\n          \"activity\":\"Visit the Belvedere Palace, housing masterpieces of Austrian art, including Klimt's 'The Kiss'\",\n           \"notes\":\"Explore the palace and art\"\n        },\n        \"midday\":{\n           \"time\":\"11:00 AM\",\n           \"activity\":\"If you are departing today, head to the airport. Otherwise, enjoy the city more, checking out local markets or taking a stroll through different neighborhoods.\",\n           \"notes\":\"Plan travel ahead to the airport.\"\n         },\n         \"afternoon\":{\n          \"time\":\"1:00 PM\",\n          \"activity\":\"Enjoy a final meal in Vienna before you head off to the airport, or if staying longer continue to explore local museums and attractions.\",\n            \"notes\":\"Flexible based on your travel plans\"\n         },\n        \"late_afternoon\":{\n          \"time\":\"3:00 PM\",\n         \"activity\":\"Extend your stay to delve deeper in the city, visiting local flea markets, other districts or taking a relaxing stroll along the river.\",\n          \"notes\":\"Flexible based on your travel plan\"\n       }\n    }\n  },\n  \"accommodation\": {\n    \"recommendation\": \"Budget-friendly hotels or hostels in areas like Neubau, Mariahilf, or near the city center. Look for accommodations with good reviews and convenient access to public transport.\",\n     \"hotel_list\":[\n       {\n          \"name\":\"Wombats City Hostel Vienna - The Naschmarkt\",\n          \"address\":\"Rechte Wienzeile 35, 1040 Wien\",\n          \"cuisine\":\"Breakfast available\",\n           \"estimated_budget_inr\": 2700,\n           \"famous_for\":\"Great location and social atmosphere\"\n        },\n      {\n        \"name\":\"Hostel Ruthensteiner\",\n         \"address\":\"Robert Hamerling-Gasse 24, 1150 Wien\",\n        \"cuisine\":\"Breakfast available\",\n        \"estimated_budget_inr\": 2500,\n       \"famous_for\":\"Relaxed vibe and garden area\"\n     },\n     {\n        \"name\":\"MEININGER Vienna Downtown Franz\",\n        \"address\":\"Franz-Josef-Kai 19, 1010 Wien\",\n        \"cuisine\":\"Breakfast available\",\n        \"estimated_budget_inr\": 2900,\n        \"famous_for\":\"Modern facilities and central location\"\n      }\n    ],\n    \"notes\":\"Book accommodation in advance, especially if travelling during peak periods.\"\n  },\n  \"transportation\": {\n    \"recommendation\": \"Vienna has a fantastic public transportation system, including the U-Bahn (subway), trams, and buses. Consider purchasing a day ticket or multi-day pass for easy travel. The city centre is also very walkable.\",\n    \"notes\":\"Public transport is efficient, but the city is also walkable.\"\n  },\n  \"travel_dates\": {\n    \"note\": \"Early January in Vienna is cold, with potential for snow. Pack warm clothing. Be aware that some attractions might have reduced hours due to the New Year.\",\n    \"recommendation\":\"Pack warm clothes and waterproof shoes.\"\n    },\n  \"cuisine\": {\n    \"recommendation\": \"Try local specialties such as Wiener Schnitzel, Tafelspitz (boiled beef), Sachertorte (chocolate cake), and Apfelstrudel (apple strudel). Visit a traditional coffeehouse for an authentic experience.\",\n    \"notes\": \"Enjoy the local cuisine and sweets.\"\n  },\n  \"additional_recommendations\": {\n    \"packing_tips\": [\n      \"Warm layers of clothing, including a winter coat, hat, gloves, and scarf.\",\n      \"Comfortable, waterproof walking shoes.\",\n      \"Travel adapter (if needed).\",\n      \"Small day backpack.\",\n      \"Reusable water bottle.\"\n    ],\n    \"cultural_insights\": [\n      \"Viennese people are generally polite and reserved. Use formal greetings like 'Grüß Gott'.\",\n      \"Tipping in restaurants is expected (around 5-10%).\",\n      \"Be aware that many shops are closed on Sundays.\"\n    ],\n    \"local_festivals\": {\n     \"note\":\"Check for events and local festivities during your travel dates, especially around new year's.\"\n     },\n    \"safety_precautions\": [\n      \"Be aware of your surroundings, especially in crowded areas.\",\n      \"Keep valuables secure and be mindful of pickpockets.\",\n      \"Stick to well-lit areas at night.\",\n       \"Share your itinerary with a friend or family member.\",\n       \"Follow local laws and advice.\"\n    ]\n  }\n}\n```\n"},
          ],
        },
      ],
    });
    const prompt=`Using the user's input from the trip recommendation form, where they have selected **[Type of Experience: ${data.experience}]**, specified their preferred activities such as **[Activity Preferences: ${data.activityPreferences.map((d,i)=>{return d})}]**, and mentioned their travel companions as **[Travel Companions: ${data.companions}]**, generate a detailed and personalized travel plan in JSON format. Begin with an overview of the recommended destination, explaining why it aligns with their preferences for experience type and activities. Create a day-by-day detailed itinerary tailored to the selected duration of **[Trip Duration: ${data.duration}]**, incorporating their chosen activities and companions. Suggest accommodations based on **[Preferred Accommodation: ${data.accommodation}]** that fit their specified budget of **[Budget: ${data.budget}]**, including a list of hotels with the following details: name, address, cuisine offered, estimated budget in INR, and what the hotel is famous for. Provide tips for transportation, best travel dates **([Travel Dates: ${data.travelDates.start}  - ${data.travelDates.end}])**, and highlight local cuisines to try. Include additional recommendations such as packing tips, cultural insights, local festivals happening during the travel dates, and safety precautions. Ensure the JSON output is structured and contains all the required details to make the trip both seamless and enjoyable, offering a perfect balance of relaxation and adventure.`
    const result = await chatSession.sendMessage(prompt);
    console.log(result.response.text());
    res.json(result.response.text());

    
  } catch (error) {
    console.error("Error fetching place information:", error.message);
    res.status(500).json({ error: "Failed to fetch place information." });
  }
  
  
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
