import { Search, SentimentDissatisfied } from "@mui/icons-material";
import {
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { config } from "../App";
import ProductCard from "./ProductCard"
import Cart, {generateCartItemsFrom} from "./Cart"
import Footer from "./Footer";
import Header from "./Header";
import "./Products.css";

// Definition of Data Structures used
/**
 * @typedef {Object} Product - Data on product available to buy
 * 
 * @property {string} name - The name or title of the product

/**
 * @typedef {Object} CartItem -  - Data on product added to cart
 * 
 * @property {string} name - The name or title of the product in cart
 * @property {string} qty - The quantity of product added to cart
 * @property {string} category - The category that the product belongs to
 * @property {number} cost - The price to buy the product
 * @property {number} rating - The aggregate rating of the product (integer out of five)
 * @property {string} image - Contains URL for the product image
 * @property {string} _id - Unique ID for the product
 */


const Products = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filterProducts, setFilterProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [debounceTimeout, setDebounceTimeout] = useState(0);

  const token = localStorage.getItem("token");


  // TODO: CRIO_TASK_MODULE_PRODUCTS - Fetch products data and store it
  /**
   * Make API call to get the products list and store it to display the products
   *
   * @returns { Array.<Product> }
   *      Array of objects with complete data on all available products
   *
   * API endpoint - "GET /products"
   *
   * Example for successful response from backend:
   * HTTP 200
   * [
   *      {
   *          "name": "iPhone XR",
   *          "category": "Phones",
   *          "cost": 100,
   *          "rating": 4,
   *          "image": "https://i.imgur.com/lulqWzW.jpg",
   *          "_id": "v4sLtEcMpzabRyfx"
   *      },
   *      {
   *          "name": "Basketball",
   *          "category": "Sports",
   *          "cost": 100,
   *          "rating": 5,
   *          "image": "https://i.imgur.com/lulqWzW.jpg",
   *          "_id": "upLK9JbQ4rMhTwt4"
   *      }
   * ]
   *
   * Example for failed response from backend:
   * HTTP 500
   * {
   *      "success": false,
   *      "message": "Something went wrong. Check the backend console for more details"
   * }
   */
  const performAPICall = async () => {

    setLoading(true);

    try{
      const response = await axios.get(`${config.endpoint}/products`);

      setLoading(false);
      setProducts(response.data);
      setFilterProducts(response.data);

      return response.data;

    }catch(err){
      setLoading(false);

      if(err.response && err.response.status === 500){
        enqueueSnackbar(err.response.data.message, {variant: "error"});
        return null;
      } else {
        enqueueSnackbar("Could not fetch products. Ckeck that the backend is running, reachable and returns valid JSON", {variant: "error"})
      }
    }
  };


  // TODO: CRIO_TASK_MODULE_PRODUCTS - Implement search logic
  /**
   * Definition for search handler
   * This is the function that is called on adding new search keys
   *
   * @param {string} text
   *    Text user types in the search bar. To filter the displayed products based on this text.
   *
   * @returns { Array.<Product> }
   *      Array of objects with complete data on filtered set of products
   *
   * API endpoint - "GET /products/search?value=<search-query>"
   *
   */
  const performSearch = async (text) => {

    try{
      const response = await axios.get(`${config.endpoint}/products/search?value=${text}`);

      setFilterProducts(response.data);
      return response.data;

    }catch(err){

      if(err.response){
        if(err.response.status === 404){
          setFilterProducts([]);
        } 

        if(err.response.status === 500){
          enqueueSnackbar(err.response.data.message, {variant: "error"});
          setFilterProducts(products);
        } 
      }else{
        enqueueSnackbar("Could not fetch products. Ckeck that the backend is running, reachable and returns valid JSON", {variant: "error"});
      }
    };
  }

  // TODO: CRIO_TASK_MODULE_PRODUCTS - Optimise API calls with debounce search implementation
  /**
   * Definition for debounce handler
   * With debounce, this is the function to be called whenever the user types text in the searchbar field
   *
   * @param {{ target: { value: string } }} event
   *    JS event object emitted from the search input field
   *
   * @param {NodeJS.Timeout} debounceTimeout
   *    Timer id set for the previous debounce call
   *
   */
  const debounceSearch = (event, debounceTimeout) => {

    const value = event.target.value;

    if(debounceTimeout){
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout( ()=>{
      performSearch(value);
    }, 500);

    setDebounceTimeout(timeout);
  };


  
  const fetchCart = async(token) => {
    if(!token)
      return;

    try{
      // TODO: CRIO_TASK_MODULE_CART - Pass Bearer token inside "Authorization" header to get data from "GET /cart"

      const response = await axios.get(`${config.endpoint}/cart`, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
      
    }catch(err){
      if(err.response && err.response.status === 400){
        enqueueSnackbar(err.response.data.message, {variant: "error"});
      } else {
        enqueueSnackbar("Could not cart details. Ckeck that the backend is running, reachable and returns valid JSON", {variant: "error"})
      }
      return null;
    }
  }


  const updateCartItems = (cartData, products) => {
    const cardItems = generateCartItemsFrom(cartData, products);
    setItems(cardItems);
  }


  const isItemInCart = (items, productId) => {

    if(items){
      return items.findIndex((item) => item.productId === productId) !== -1;
    }

  };


  const addToCart = async(token, items, products, productId, qty, options={preventDuplicate: false}) => {
    if(!token){
      enqueueSnackbar("Login to add item to the Cart", {variant: "warning"});
      return;
    }

    if(options.preventDuplicate && isItemInCart(items, productId)){
      enqueueSnackbar("Item already in cart. Use the cart sidebar to update quantity or remove item", {variant: "warning"});
      return;
    }

    try{
      const response = await axios.post(`${config.endpoint}/cart`, 
        {productId, qty}, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      updateCartItems(response.data, products);
    } catch(err){
        if(err.response){
          enqueueSnackbar(err.response.data.message, {variant: "error"});
        }else{
          enqueueSnackbar("Could not fetch products. Ckeck that the backend is running, reachable and returns valid JSON", {variant: "error"});
        }
    }
 
  }


  useEffect( () => {
    const onLoadHandler = async() => {
      const productsData = await performAPICall();
      const cartData = await fetchCart(token);
      const cartDetails = await generateCartItemsFrom(cartData, productsData);
      setItems(cartDetails);
    }
    
    onLoadHandler();
  }, [])


  return (
    <div>
      <Header>
        {/* TODO: CRIO_TASK_MODULE_PRODUCTS - Display search bar in the header for Products page */}
        <TextField
          className="search-desktop"
          size="small"
          InputProps={{
            className: "search",
            endAdornment: (
              <InputAdornment position="end">
                <Search color="primary"/>
              </InputAdornment>
            ),
          }}
          placeholder="Search for items/categories"
          name="search"
          onChange={(e) => debounceSearch(e, debounceTimeout)}
        />
      </Header>

      {/* Search view for mobiles */}
      <TextField
        className="search-mobile"
        size="small"
        fullWidth
        InputProps={{
          className: "search",
          endAdornment: (
            <InputAdornment position="end">
              <Search color="primary" />
            </InputAdornment>
          ),
        }}
        placeholder="Search for items/categories"
        name="search"
        onChange={(e) => debounceSearch(e, debounceTimeout)}
      />
       <Grid container>
         <Grid item className="product-grid" xs={12} md={token && products.length ? 9 : 12}>
            <Box className="hero">
             <p className="hero-heading">
               India’s <span className="hero-highlight">FASTEST DELIVERY</span>{" "}
               to your door step
             </p>
            </Box>

            {loading ? (
              <Box className="loading">
                <CircularProgress />
                <h4>Loading Products...</h4>
              </Box>
            ) : (
              <Grid container marginY="1rem" paddingX="1rem" spacing={2}>
                {filterProducts.length ? (
                  filterProducts.map((product) => (
                    <Grid item xs={6} md={3} key={product._id}>
                      <ProductCard 
                        product={product}
                        handleAddToCart={async() => {
                          await addToCart(token, items, products, product._id, 1, 
                            {preventDuplicate: true}
                          );
                        }}
                      />
                    </Grid>
                  ))
                ) : (
                  <Box className="loading">
                    <SentimentDissatisfied color="action" />
                    <h4 style={{color: "#636363"}}>No products found</h4>
                  </Box>
                )}               
              </Grid>
            )}
         </Grid>
      

        {/* TODO: CRIO_TASK_MODULE_CART - Display the Cart component */}


        {token && (
          <Grid item xs={12} md={3} bgcolor="#E9F5E1">
            <Cart 
              hasCheckoutButton
              products={products}
              items={items}
              handleQuantity={addToCart}
            />
          </Grid>
        )}

       </Grid>

      <Footer />
    </div>
  );
};

export default Products;
