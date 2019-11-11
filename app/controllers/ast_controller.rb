require 'ast_node'

class AstController < ApplicationController
  def run
    ast        = Fast.ast(params[:code])
    match_data = Fast.search(params[:pattern], ast) || []
    matches    = match_data.map { |m| AstNode.new(m).to_h }

    # Careful, `to_json` on an `ast` will blow up. Need to inspect why later
    render json: { ast: ast.to_s, matches: matches }
  rescue
    # Lazy rescue for now
    render json: { ast: '', matches: [] }
  end
end
