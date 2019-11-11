class Extract
  def initialize(**path)
    @path = path
  end

  def call(value, remaining_paths = @path)
    return false # and implement this later. Probably needs to be a gem...

    remaining_paths.reduce({}) { |state, (path_key, further_paths)|
      state.merge!(value.public_send(path_key))
    }
  end

  def to_proc
    -> value { self.call(value) }
  end

  alias_method :===, :to_proc

  def self.[](**path)
    new(**path)
  end
end
