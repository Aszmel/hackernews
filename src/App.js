import React, { Component } from "react";
import "./App.css";
import axios from "axios";
import PropTypes from "prop-types";
import { sortBy } from "lodash";
import classNames from "classnames";

const DEFAULT_QUERY = "";
const PATH_BASE = "https://hn.algolia.com/api/v1";
const PATH_SEARCH = "/search";
const PARAM_SEARCH = "query=";
const PARAM_PAGE = "page=";
const DEFAULT_HPP = "100";
const PARAM_HPP = "hitsPerPage=";

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, "title"),
  AUTHOR: list => sortBy(list, "author"),
  COMMENTS: list => sortBy(list, "num_comments").reverse(),
  POINTS: list => sortBy(list, "points").reverse()
};

class App extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      results: null,
      searchKey: "",
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
      sortKey: "NONE",
      isSortReverse: false
    };
  }

  needToSearchTopStories = searchTerm => {
    return !this.state.results[searchTerm];
  };

  onSearchSubmit = event => {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    if (this.needToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    event.preventDefault();
  };

  setSearchTopStories = result => {
    const { hits, page } = result;
    const { searchKey, results } = this.state;
    const oldHits =
      results && results[searchKey] ? results[searchKey].hits : [];
    const updatedHits = [...oldHits, ...hits];
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      },
      isLoading: false
    });
  };

  fetchSearchTopStories = (searchTerm, page = 0) => {
    this.setState({ isLoading: true });
    axios(
      `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`
    )
      .then(result => this._isMounted && this.setSearchTopStories(result.data))
      .catch(error => this._isMounted && this.setState({ error }));
  };

  onDismiss = id => {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];
    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  };

  onSearchChange = event => {
    this.setState({ searchTerm: event.target.value });
  };

  componentDidMount() {
    this._isMounted = true;
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onSort = sortKey => {
    const isSortReverse =
      this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  };

  //***********MAIN RENDER *************/
  render() {
    const {
      searchTerm,
      results,
      searchKey,
      error,
      isLoading,
      sortKey,
      isSortReverse
    } = this.state;
    const page =
      (results && results[searchKey] && results[searchKey].page) || 0;
    const list =
      (results && results[searchKey] && results[searchKey].hits) || [];

    if (!results) {
      return null;
    }

    return (
      <div className="page">
        <h1 className="title">
          Welcome to Hackernews, search for IT articles engine
        </h1>
        <div className="interactions">
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >
            Search
          </Search>
        </div>
        {error ? (
          <div className="interactions">
            <p>Something went wrong!</p>
          </div>
        ) : (
          <Table
            list={list}
            sortKey={sortKey}
            onSort={this.onSort}
            onDismiss={this.onDismiss}
            isSortReverse={isSortReverse}
          />
        )}

        <div className="interactions">
          {isLoading ? (
            <Loading />
          ) : (
            <ButtonWithLoading
              isLoading={isLoading}
              onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}
            >
              More
            </ButtonWithLoading>
          )}
        </div>
      </div>
    );
  }
}
//************************************/

class Search extends Component {
  componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
  }

  render() {
    const { value, onChange, onSubmit, children } = this.props;

    return (
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={el => (this.input = el)}
        />
        <button type="submit">{children}</button>
      </form>
    );
  }
}

const Table = ({ list, sortKey, isSortReverse, onSort, onDismiss }) => {
  const sortedList = SORTS[sortKey](list);
  const reverseSortedList = isSortReverse ? sortedList.reverse() : sortedList;

  return (
    <div className="table">
      <div className="table-header">
        <span style={{ width: "40%" }}>
          <Sort sortKey={"TITLE"} onSort={onSort} activeSortKey={sortKey}>
            Title
          </Sort>
        </span>
        <span style={{ width: "30%" }}>
          <Sort sortKey={"AUTHOR"} onSort={onSort} activeSortKey={sortKey}>
            Author
          </Sort>
        </span>
        <span style={{ width: "10%" }}>
          <Sort sortKey={"COMMENTS"} onSort={onSort} activeSortKey={sortKey}>
            Comments
          </Sort>
        </span>
        <span style={{ width: "10%" }}>
          <Sort sortKey={"POINTS"} onSort={onSort} activeSortKey={sortKey}>
            Points
          </Sort>
        </span>
        <span style={{ width: "10%" }}>Archive</span>
      </div>
      {reverseSortedList.map(item => (
        <div key={item.objectID} className="table-row">
          <span style={{ width: "40%" }}>
            <a href={item.url}>{item.title}</a>
          </span>
          <span style={{ width: "30%" }}>{item.author}</span>
          <span style={{ width: "10%" }}>{item.num_comments}</span>
          <span style={{ width: "10%" }}>{item.points}</span>
          <span style={{ width: "10%" }}>
            <Button
              onClick={() => onDismiss(item.objectID)}
              className="button-inline"
            >
              Dismiss
            </Button>
          </span>
        </div>
      ))}
    </div>
  );
};

const Sort = ({ sortKey, activeSortKey, onSort, children }) => {
  const sortClass = classNames("button-inline", {
    "button-active": sortKey === activeSortKey
  });

  return (
    <Button onClick={() => onSort(sortKey)} className={sortClass}>
      {children}
    </Button>
  );
};

const Button = ({ onClick, className = "", children }) => (
  <button onClick={onClick} className={className} type="button">
    {children}
  </button>
);

const Loading = () => (
  <div>
    <h3>Loading...</h3>
  </div>
);

const withLoading = Component => ({ isLoading, ...rest }) =>
  isLoading ? <Loading /> : <Component {...rest} />;

const ButtonWithLoading = withLoading(Button);

// *** Prop Types ***
// Button.defaultProps = {
//   className: '',
//   };  <---------------then you can omit declaration of className=''

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired
};

export default App;

export { Search, Table, Button };
