class AstNode
  def initialize(node)
    @node = node
  end

  def to_h
    {
      ast:      @node.to_s,
      type:     @node.type,
      source:   source,
      position: position,
      lines:    lines
    }
  end

  def expression
    @node.loc.expression
  end

  def source
    expression.source
  end

  def position
    [expression.begin_pos, expression.end_pos]
  end

  def lines
    [expression.first_line, expression.last_line]
  end
end
