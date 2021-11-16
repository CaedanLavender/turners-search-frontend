import './App.css';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce/lib';
import { ReactComponent as SearchSVG } from './assets/search.svg';
import cleanText from './functions/cleanText';


function App() {
	//ENVIRONMENT SETUP (DISTINGUISHES BETWEEN DEVELOPMENT AND PRODUCTION)
	const remoteURL = "https://turners-search-backend.herokuapp.com/"
	const endpoint = remoteURL

	// REACT STATES
	const [autocomplete, setAutocomplete] = useState([]);
	const debounced = useDebouncedCallback(value => getAutocomplete(value), 750);
	const [searchTerm, setSearchTerm] = useState();
	const [searchResults, setSearchResults] = useState([]);
	const [collectionList, setCollectionList] = useState([]);
	const [currentCollection, setCurrentCollection] = useState();

	// COLLECTION SETUP
	const getCollections = () => {
		axios.get(endpoint + 'collections')
			.then(res => {
				setCollectionList(res.data)
				setCurrentCollection(res.data[0].collection_id)
			})
			.catch(() => console.log("There was a catch error"));
	}

	// Runs the function to set up the collection list on page load
	useEffect(() => getCollections(), [])

	const getAutocomplete = (text) => {
		if (text) {
			axios.get(endpoint + 'autocomplete', {
				params: {
					prefix: cleanText(text),
					collection: currentCollection
				}
			})
				.then(res => setAutocomplete(res.data.completions))
				.catch(() => console.log("There was a catch error"));
		} else {
			setAutocomplete([]);
		}
	}

	// SEARCH HANDLERS
	const handleEnter = (e) => {
		if (e.charCode === 13) handleSearch();
		setAutocomplete([])
	}

	const handleSearch = () => {
		getSearch(searchTerm)
	}

	const getSearch = (search) => {
		if (search) {
			axios.get(endpoint + 'search', { params: { search: cleanText(search), collection: currentCollection } })
				.then(res => {
					setSearchResults(res.data.results)
					setAutocomplete([])
				})
				.catch(() => console.log("There was a catch error"))
		} else {
			console.log("text returned false")
			setSearchResults({})
		}
	}

	const openInNewTab = (url) => {
		const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
		if (newWindow) newWindow.opener = null
	}

	const getLimitedText = (text, limit) => {
		return text.length > limit ? text.slice(0, limit - 3) + "..." : text
	}

	// PAGE RENDER
	return (
		<div className="App">
			<div className="upper">
				{/* TITLE */}
				<div className='title'>Search Turners Beta</div>

				{/* SEARCH BOX */}
				<div className='searchContainer'>
					<div className='searchContainer__searchWrapper'>

						{/* SEARCH ICON */}
						<SearchSVG className='searchIcon' />

						{/* SEARCH FIELD */}
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value)
								debounced(e.target.value)
							}}
							onKeyPress={handleEnter}
						/>
						<div className="goButton" onClick={handleSearch}>
							Search
						</div>
						<select name="collection" id="collection" value={currentCollection} onChange={(e) => setCurrentCollection(e.target.value)}>
							{
								collectionList.map((item) => (
									<option value={item.collection_id}>{item.name}</option>
								))
							}
						</select>
					</div>

					{/* AUTOCOMPLETE LIST */}
					<div className={`searchContainer__autocomplete ${(autocomplete[0]) || "hidden"}`}>
						{
							autocomplete.map((item) => (
								<div className='searchContainer__autocomplete__item'
									onClick={() => {
										setSearchTerm(item)
										setAutocomplete([])
									}}>
									{item}
								</div>
							))
						}
					</div>
				</div>

			</div>
			<div className='lower'>
				<div className='searchResultContainer'>
					<div className="gradient"></div>

					{/* SEARCH RESULTS */}
					{
						searchResults.map((item) => (
							<div className='searchResultItem' onClick={() => openInNewTab(item.metadata.source.url)}>
								<h3>{item.title[0].length > 150 ? item.title[0].slice(0, 147) + "..." : item.title}</h3>
								<div className='searchResultItem__text'>
									<p>
										{getLimitedText(item.text[0], 1000)}
									</p>
									<br />
									<p className="searchResultItem__link">
										Source: {item.metadata.source.url}
									</p>
								</div>
								<div className='pillBoxSuper'>
									<div className='pillBox'>
										{
											item.enriched_text[0].keywords?.slice(0, 8).map((keyword) => (
												<div className='pill' style={{
													backgroundColor: `rgba(50, 50, 50, ${keyword.relevance})`,
													color: keyword.relevance > 0.55 ? "white" : "black"
												}}>
													{keyword.text}
												</div>
											))
										}
									</div>

									<div className='pillBox'>
										{
											item.enriched_text[0].entities?.slice(0, 3).map((keyword) => (
												<div className='pill'>{keyword.text}</div>
											))
										}
									</div>
								</div>
							</div>
						))
					}
				</div>
			</div>
		</div>
	);
}

export default App;