import React from 'react'
import ReactDOM from 'react-dom'

import debounce from 'lodash.debounce'

import { uniqBy } from 'ramda'

import Axios from 'axios'

const csrfToken = document.querySelector('[name=csrf-token]').content
Axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken

import {
  Input, Container, Row, Col
} from 'reactstrap'

const noMatchesState = {
  ast:     '',
  matches: []
}

const additionExampleState = {
  code:    '1 + 1',
  pattern: '(_ 1)'
};

const lazyCodeStyle = {
  background: '#FFF',
  color:      '#333',
  border:     '1px solid #AAA',
  padding:    '10px',
  width:      '100%',
  height:     '100%'
}

const lazyHeader = {
  margin: '25px 15px',
  width: '100%'
}

const lazyHeaderBorder = {
  borderBottom: '2px solid #DDD',
  margin: '15px',
  width: '100%'
}

const DEBOUNCE_WAIT = 1000;

const wrap = tag => str => `<${tag}>${str}</${tag}>`
const mark = wrap('mark')

RegExp.escape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

class AstExplorer extends React.Component {
  constructor() {
    super();

    this.state = {
      ...additionExampleState,
      ...noMatchesState
    };

    this.requestResult = debounce(this.requestResult, DEBOUNCE_WAIT);
  }

  resetMatches() {
    this.setState(noMatchesState);
  }

  requestResult() {
    console.log(this.state)

    Axios.post('/ast', {
      code:    this.state.code,
      pattern: this.state.pattern
    }).then(response => {
      const { ast, matches } = response.data;
      this.setState({ ast, matches });
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  handleAstChange(event) {
    this.setState({ pattern: event.target.value });
    this.requestResult()
  }

  handleCodeChange(event) {
    this.setState({ code: event.target.value });
    this.requestResult()
  }

  matchResults() {
    const matchItems = this.state.matches.map((m, i) => {
      const [a, b] = m.position
      const [x, y] = m.lines

      return (
        <Container key="match-{i}" style={{
          maxWidth: '100%',
          marginLeft: '15px',
          marginBottom: '25px'
        }}>
          <Row>
            <h4>{m.type} node @ ({a}:{b}) on lines ({x}:{y}) :</h4>
          </Row>

          <Row style={{
            marginBottom: '25px'
          }}>
            <Col>
              <h5>Source:</h5>

              <pre style={lazyCodeStyle}><code>{
                m.source
              }</code></pre>
            </Col>

            <Col>
              <h5>AST:</h5>

              <pre style={lazyCodeStyle}><code>{
                m.ast
              }</code></pre>
            </Col>
          </Row>
        </Container>
      );
    });

    return matchItems;
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  highlightCode(code) {
    const adjustSize = '<mark></mark>'.length
    const adjustment = i => adjustSize * i;

    const replace = fn => {
      return (s, [a, b], i = 0) => {
        let [x, y] = [a + adjustment(i), b + adjustment(i)];

        const prefix = (x === 0) ? '' : `${s.substring(0, x)}`
        const substitute = s.substring(x, y);
        const suffix = (y === s.length) ? '' : `${s.substring(y)}`;

        return `${prefix}${fn(substitute)}${suffix}`;
      }
    }

    const replaceHighlight = replace(mark);

    const res = this.state.matches.reduce(
      (s, m, i) => replaceHighlight(s, m.position, i),
      this.escapeHtml(code)
    );

    return { __html: res };
  }

  highlightAst(code) {
    const whiteSpaceIgnore = s => s.split("\n").map(l => `( *)${l.replace(/^ +/, '')}`).join("\n")
    const globalMatch = s => {
      console.log({
        s,
        ws: whiteSpaceIgnore(s),
        wse: whiteSpaceIgnore(RegExp.escape(s))
      })

      return new RegExp(
        whiteSpaceIgnore(RegExp.escape(s)), 'g'
      )
    }

    const uniqueMatches = uniqBy(m => m.ast, this.state.matches)

    const res = uniqueMatches
      .reduce((s, m) => {
        console.log({ gm: globalMatch(m.ast), m: mark(m.ast) })

        return s.replace(globalMatch(m.ast), `$1${mark(m.ast)}`)
      }, code);

    console.log(res)

    return { __html: res };
  }

  renderedResults() {
    if (!this.state.ast) return;

    return (
      <Row>
        <Container style={{
          maxWidth: '100%',
          background: '#CCC',
          color: '#333',
          border: '3px solid #AAA',
          padding: '30px'
        }}>
          <Row>
            <h3 style={lazyHeaderBorder}>AST Matches</h3>
          </Row>

          <Row>
            {this.matchResults()}
          </Row>

          <Row>
            <h3 style={lazyHeaderBorder}>Generated AST</h3>
          </Row>

          <Row>
            <Col height='100%'>
              <pre style={lazyCodeStyle}><code dangerouslySetInnerHTML={
                this.highlightCode(this.state.code)
              }></code></pre>
            </Col>

            <Col height='100%'>
              <pre style={lazyCodeStyle}><code dangerouslySetInnerHTML={
                this.highlightAst(this.state.ast)
              }></code></pre>
            </Col>
          </Row>
        </Container>
      </Row>
    );
  }

  render() {
    return (
      <div>
        <div style={{
          background: '#CCC',
          borderBottom: '5px solid #AAA',
          padding: '10px',
          marginBottom: '15px'
        }}>
          <h1>Ruby AST Explorer - ALPHA</h1>

          <h2>
            <a href="https://github.com/rubocop-hq/rubocop/blob/master/lib/rubocop/node_pattern.rb#L25">
              (NodePattern Reference)
            </a>
          </h2>
        </div>

        <Container style={{
          maxWidth: '95%'
        }}>

          <Row>
            <h2 style={lazyHeader}>Input</h2>
          </Row>

          <Row>
            <Container style={{
              maxWidth: '100%',
              background: '#CCC',
              color: '#333',
              border: '3px solid #AAA',
              padding: '30px'
            }}>
              <Row>
                <h3 style={lazyHeaderBorder}>AST</h3>
              </Row>

              <Row>
                <Col>
                  <Input
                    type="textarea"
                    defaultValue={this.state.pattern}
                    onChange={this.handleAstChange.bind(this)}
                    rows="10"
                    style={{
                      width: '100%'
                    }}
                  />
                </Col>
              </Row>

              <Row>
                <h3 style={lazyHeaderBorder}>Code</h3>
              </Row>

              <Row>
                <Col>
                  <Input
                    type="textarea"
                    defaultValue={this.state.code}
                    onChange={this.handleCodeChange.bind(this)}
                    rows="10"
                    style={{
                      width: '100%'
                    }}
                  />
                </Col>
              </Row>
            </Container>
          </Row>
        </Container>

        <hr />

        <Container style={{
          maxWidth: '95%'
        }}>
          <Row>
            <h2 style={lazyHeader}>Result</h2>
          </Row>

          {this.renderedResults()}
        </Container>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const targetElement = document.createElement('div');

  ReactDOM.render(
    <AstExplorer />,
    document.body.appendChild(targetElement),
  )
})
