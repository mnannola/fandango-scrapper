<template>
  <v-container>
    <v-layout column align-center>
      
      <v-form
        action="/api/results" 
        method="POST" 
        id="search-form" 
        ref="form">
        <v-select
          v-model="movie"
          :items="movieList"
          item-text="title"
          item-value="link"
          :loading=loading
          label="Movies">
        </v-select>
        <v-select
          v-model="numOfSeats"
          label="Number of Seats"
          :items=seats>
        </v-select>
        <v-btn
          type="submit"
          form="search-form">
          search
        </v-btn>
      </v-form>
    </v-layout>
  </v-container>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      movieList: [],
      movie: {},
      loading: true,
      seats: [...Array(10).keys()]

    }
  },
  methods: {
    search() {

    }
  },
  mounted() {
    axios
    .get('/api/search')
    .then(results => {
      this.movieList = results.data;
    })
    .catch(error => {
      console.log(error);
    })
    .finally( () => { this.loading = false})
  }
};
</script>
